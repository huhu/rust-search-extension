const OFFSCREEN_TARGET = "rustdoc-search-offscreen";
const SANDBOX_TARGET = "rustdoc-search-sandbox";
const SOURCE_TARGET = "rustdoc-search-source";
const SANDBOX_URL = "sandbox/rustdoc-search.html";
const SEARCH_CORE_PATH = "search/docs/stringdex-search-core.js";
const REQUEST_TIMEOUT_MS = 3000;
const SUPERSEDED_REQUEST_ERROR = "Rustdoc search request superseded by a newer query";

let sandboxFramePromise = null;
let nextRequestId = 1;
let sourceBridgeInstalled = false;
const sourceTextPromises = new Map();

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.target !== OFFSCREEN_TARGET) {
        return false;
    }

    postToSandbox(message.request)
        .then(result => sendResponse({ ok: true, result }))
        .catch(error => sendResponse({ ok: false, error: error.message }));
    return true;
});

async function postToSandbox(request) {
    const frame = await getSandboxFrame();
    installSourceBridge(frame.contentWindow);
    const id = nextRequestId++;
    return await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            cleanup();
            reject(new Error(`Timed out waiting for rustdoc search sandbox ${JSON.stringify({ fun: "postToSandbox", id, request })}`));
        }, REQUEST_TIMEOUT_MS);

        const onMessage = event => {
            if (event.source !== frame.contentWindow) {
                return;
            }
            const message = event.data;
            if (message?.target !== SANDBOX_TARGET) {
                return;
            }
            // one query simultaneously
            if (message.id > id) {
                cleanup();
                reject(new Error(SUPERSEDED_REQUEST_ERROR));
                return;
            }
            if (message.id !== id) {
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
        frame.contentWindow.postMessage({
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

async function getSandboxFrame() {
    if (!sandboxFramePromise) {
        sandboxFramePromise = new Promise((resolve, reject) => {
            const frame = document.createElement("iframe");
            frame.src = chrome.runtime.getURL(SANDBOX_URL);
            frame.style.display = "none";
            frame.onload = () => resolve(frame);
            frame.onerror = () => reject(new Error("Failed to load rustdoc search sandbox"));
            document.body.appendChild(frame);
        });
    }
    return await sandboxFramePromise;
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
