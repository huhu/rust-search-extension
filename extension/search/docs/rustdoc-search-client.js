const OFFSCREEN_DOCUMENT_URL = "offscreen.html";
const SANDBOX_URL = "sandbox/rustdoc-search.html";
const OFFSCREEN_TARGET = "rustdoc-search-offscreen";
const SANDBOX_TARGET = "rustdoc-search-sandbox";
const SOURCE_TARGET = "rustdoc-search-source";
const SEARCH_CORE_PATH = "search/docs/stringdex-search-core.js";
const REQUEST_TIMEOUT_MS = 3000;
const SUPERSEDED_REQUEST_ERROR = "Rustdoc search request superseded by a newer query";

let nextRequestId = 1;
let offscreenDocumentPromise = null;
let sandboxFramePromise = null;
let sourceBridgeInstalled = false;
const sourceTextPromises = new Map();

export default class RustdocSearchSandboxClient {
    static async search(crate, query) {
        return await requestSandbox({
            type: "search",
            crate,
            query,
        });
    }

    static isSupersededRequestError(error) {
        return error?.message === SUPERSEDED_REQUEST_ERROR;
    }
}

async function requestSandbox(request) {
    if (canUseDomFrame()) {
        return await requestSandboxFromDom(request);
    }
    return await requestSandboxFromOffscreen(request);
}

function canUseDomFrame() {
    return typeof window !== "undefined" &&
        typeof document !== "undefined" &&
        typeof document.createElement === "function";
}

async function requestSandboxFromDom(request) {
    const frame = await getSandboxFrame();
    installSourceBridge(frame.contentWindow);
    return await postMessageToSandbox(frame.contentWindow, request);
}

async function getSandboxFrame() {
    if (!sandboxFramePromise) {
        sandboxFramePromise = new Promise((resolve, reject) => {
            const frame = document.createElement("iframe");
            frame.src = chrome.runtime.getURL(SANDBOX_URL);
            frame.style.display = "none";
            frame.onload = () => resolve(frame);
            frame.onerror = () => reject(new Error("Failed to load rustdoc search sandbox"));
            (document.body || document.documentElement).appendChild(frame);
        });
    }
    return await sandboxFramePromise;
}

function postMessageToSandbox(targetWindow, request) {
    const id = nextRequestId++;
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            cleanup();
            reject(new Error(`Timed out waiting for rustdoc search sandbox ${JSON.stringify({ id, request })}`));
        }, REQUEST_TIMEOUT_MS);

        const onMessage = event => {
            if (event.source !== targetWindow) {
                return;
            }
            const message = event.data;
            if (message?.target !== SANDBOX_TARGET || message.id !== id) {
                return;
            }

            cleanup();
            if (message.ok) {
                resolve(message.result);
            } else {
                reject(new Error(message.error || "Rustdoc search sandbox failed"));
            }
        };

        const cleanup = () => {
            clearTimeout(timer);
            window.removeEventListener("message", onMessage);
        };

        window.addEventListener("message", onMessage);
        targetWindow.postMessage({
            target: SANDBOX_TARGET,
            id,
            request,
        }, "*");
    });
}

function installSourceBridge(targetWindow) {
    if (sourceBridgeInstalled) {
        return;
    }
    sourceBridgeInstalled = true;

    window.addEventListener("message", event => {
        if (event.source !== targetWindow) {
            return;
        }
        const message = event.data;
        if (message?.target !== SOURCE_TARGET) {
            return;
        }

        fetchScriptSource(message)
            .then(source => {
                targetWindow.postMessage({
                    target: SOURCE_TARGET,
                    id: message.id,
                    ok: true,
                    source,
                }, "*");
            })
            .catch(error => {
                targetWindow.postMessage({
                    target: SOURCE_TARGET,
                    id: message.id,
                    ok: false,
                    error: error.message,
                }, "*");
            });
    });
}

async function requestSandboxFromOffscreen(request) {
    await ensureOffscreenDocument();
    const message = {
        target: OFFSCREEN_TARGET,
        request,
    };
    try {
        return await sendRuntimeMessage(message);
    } catch (error) {
        if (!/Receiving end does not exist/i.test(error.message)) {
            throw error;
        }
        await delay(50);
        return await sendRuntimeMessage(message);
    }
}

async function ensureOffscreenDocument() {
    if (!chrome.offscreen?.createDocument) {
        throw new Error("Rustdoc search sandbox requires an offscreen document in this context");
    }

    if (await hasOffscreenDocument()) {
        return;
    }

    if (!offscreenDocumentPromise) {
        offscreenDocumentPromise = chrome.offscreen.createDocument({
            url: OFFSCREEN_DOCUMENT_URL,
            reasons: ["IFRAME_SCRIPTING"],
            justification: "Run rustdoc's versioned stringdex search runtime in an isolated sandbox.",
        }).finally(() => {
            offscreenDocumentPromise = null;
        });
    }
    await offscreenDocumentPromise;
}

async function hasOffscreenDocument() {
    const offscreenUrl = chrome.runtime.getURL(OFFSCREEN_DOCUMENT_URL);
    if (chrome.runtime.getContexts) {
        const contexts = await chrome.runtime.getContexts({
            contextTypes: ["OFFSCREEN_DOCUMENT"],
            documentUrls: [offscreenUrl],
        });
        return contexts.length > 0;
    }
    if (chrome.offscreen?.hasDocument) {
        return await chrome.offscreen.hasDocument();
    }
    return false;
}

function sendRuntimeMessage(message) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(message, response => {
            if (response?.ok) {
              return resolve(response.result);
            }
            const error = chrome.runtime.lastError;
            if (error) {
                reject(new Error(error.message));
            } else {
                reject(new Error(response?.error || "Rustdoc search offscreen document failed"));
            }
        });
    });
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchScriptSource(message) {
    if (message.extensionPath) {
        return await fetchExtensionScriptSource(message.extensionPath);
    }
    if (message.url) {
        return await fetchRustdocScriptSource(message.url);
    }
    throw new Error("Missing rustdoc search script source request target");
}

async function fetchRustdocScriptSource(url) {
    const scriptUrl = normalizeRustdocScriptUrl(url);
    if (!sourceTextPromises.has(scriptUrl)) {
        const promise = fetch(scriptUrl).then(async response => {
            if (!response.ok) {
                throw new Error(`Failed to load rustdoc search script: ${response.status} ${scriptUrl}`);
            }
            return await response.text();
        });
        sourceTextPromises.set(scriptUrl, promise);
        promise.catch(() => sourceTextPromises.delete(scriptUrl));
    }
    return await sourceTextPromises.get(scriptUrl);
}

async function fetchExtensionScriptSource(extensionPath) {
    const scriptPath = normalizeExtensionScriptPath(extensionPath);
    const cacheKey = `extension:${scriptPath}`;
    if (!sourceTextPromises.has(cacheKey)) {
        const promise = fetch(chrome.runtime.getURL(scriptPath)).then(async response => {
            if (!response.ok) {
                throw new Error(`Failed to load extension script: ${response.status} ${scriptPath}`);
            }
            return await response.text();
        });
        sourceTextPromises.set(cacheKey, promise);
        promise.catch(() => sourceTextPromises.delete(cacheKey));
    }
    return await sourceTextPromises.get(cacheKey);
}

function normalizeRustdocScriptUrl(url) {
    const parsedUrl = new URL(url);
    const isDocsRs = parsedUrl.hostname === "docs.rs" || parsedUrl.hostname.endsWith(".docs.rs");
    if (parsedUrl.protocol !== "https:" || !isDocsRs || !parsedUrl.pathname.endsWith(".js")) {
        throw new Error(`Unsupported rustdoc search script URL: ${url}`);
    }
    return parsedUrl.href;
}

function normalizeExtensionScriptPath(extensionPath) {
    if (extensionPath !== SEARCH_CORE_PATH) {
        throw new Error(`Unsupported extension script path: ${extensionPath}`);
    }
    return extensionPath;
}
