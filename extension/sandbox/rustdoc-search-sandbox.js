const SANDBOX_TARGET = "rustdoc-search-sandbox";
const SOURCE_TARGET = "rustdoc-search-source";
const SEARCH_CORE_PATH = "search/docs/stringdex-search-core.js";
const MAX_RESULTS = 200;
const REQUEST_TIMEOUT_MS = 3000;

window.__RUSTDOC_SEARCH_AUTO_INIT__ = false;

const stringdexRuntimePromises = new Map();
const searcherPromises = new Map();
const sourceTextPromises = new Map();
let stringdexLoadQueue = Promise.resolve();
let initSearchPromise = null;
let nextSourceRequestId = 1;

window.addEventListener("message", event => {
    const message = event.data;
    if (message?.target !== SANDBOX_TARGET) {
        return;
    }

    handleRequest(message.request)
        .then(result => {
            event.source.postMessage({
                target: SANDBOX_TARGET,
                id: message.id,
                ok: true,
                result,
            }, "*");
        })
        .catch(error => {
            event.source.postMessage({
                target: SANDBOX_TARGET,
                id: message.id,
                ok: false,
                error: error.message,
            }, "*");
        });
});

async function handleRequest(request) {
    switch (request?.type) {
        case "search":
            return await searchCrate(request.crate, request.query);
        default:
            throw new Error(`Unknown rustdoc search sandbox request: ${request?.type}`);
    }
}

async function searchCrate(crate, query) {
    const { docSearch, DocSearch } = await getCrateSearcher(crate);
    const resultsTable = await docSearch.execQuery(
        DocSearch.parseQuery(query),
        crate.libName,
        crate.libName,
    );
    return await collectResults(resultsTable.others);
}

async function getCrateSearcher(crate) {
    const key = [
        crate.libName,
        crate.rootPath,
        crate.stringdexUrl,
        crate.rootIndexUrl,
        crate.searchIndexBaseUrl,
    ].join("\n");

    if (!searcherPromises.has(key)) {
        const promise = initCrateSearcher(crate);
        searcherPromises.set(key, promise);
        promise.catch(() => searcherPromises.delete(key));
    }
    return await searcherPromises.get(key);
}

async function initCrateSearcher(crate) {
    const initSearch = await loadInitSearch();
    const runtime = await loadStringdexRuntime(crate.stringdexUrl);
    const loader = new RustdocIndexLoader({
        rootIndexUrl: crate.rootIndexUrl,
        searchIndexBaseUrl: crate.searchIndexBaseUrl,
    });

    return await initSearch(runtime.Stringdex, runtime.RoaringBitmap, {
        headless: true,
        rootPath: crate.rootPath,
        loadRoot: callbacks => loader.loadRoot(callbacks),
        loadTreeByHash: hashHex => loader.loadTreeByHash(hashHex),
        loadDataByNameAndHash: (name, hashHex) => {
            loader.loadDataByNameAndHash(name, hashHex);
        },
    });
}

async function loadInitSearch() {
    if (!initSearchPromise) {
        initSearchPromise = fetchExtensionText(SEARCH_CORE_PATH).then(source => {
            const transformedSource = stripEsmExports(source);
            return executeSearchCore(transformedSource, SEARCH_CORE_PATH);
        });
    }
    return await initSearchPromise;
}

async function loadStringdexRuntime(stringdexUrl) {
    if (!stringdexRuntimePromises.has(stringdexUrl)) {
        const promise = stringdexLoadQueue.then(() => evaluateStringdexRuntime(stringdexUrl));
        stringdexRuntimePromises.set(stringdexUrl, promise);
        stringdexLoadQueue = promise.catch(() => {});
        promise.catch(() => stringdexRuntimePromises.delete(stringdexUrl));
    }
    return await stringdexRuntimePromises.get(stringdexUrl);
}

async function evaluateStringdexRuntime(stringdexUrl) {
    window.Stringdex = undefined;
    window.RoaringBitmap = undefined;

    const source = stripEsmExports(await fetchText(stringdexUrl));
    executeScript(source, stringdexUrl);

    if (!window.Stringdex?.loadDatabase || !window.RoaringBitmap) {
        throw new Error(`Invalid rustdoc stringdex runtime: ${stringdexUrl}`);
    }
    return {
        Stringdex: window.Stringdex,
        RoaringBitmap: window.RoaringBitmap,
    };
}

function stripEsmExports(source) {
    return source
        .replace(/^\s*export\s+(class|function)\s+/gm, "$1 ")
        .replace(/^\s*export\s+(const|let|var)\s+/gm, "$1 ")
        .replace(/^\s*export\s*\{[^}]*\};?\s*$/gm, "");
}

class RustdocIndexLoader {
    constructor({ rootIndexUrl, searchIndexBaseUrl }) {
        this.rootIndexUrl = rootIndexUrl;
        this.searchIndexBaseUrl = searchIndexBaseUrl.endsWith("/") ?
            searchIndexBaseUrl :
            `${searchIndexBaseUrl}/`;
        this.callbacks = null;
    }

    loadRoot(callbacks) {
        this.callbacks = callbacks;
        this.loadCallbackScript(this.rootIndexUrl, {
            rr_: value => callbacks.rr_(value),
        }).catch(error => callbacks.err_rr_(error));
    }

    loadTreeByHash(hashHex) {
        const callbacks = this.requireCallbacks();
        this.loadCallbackScript(`${this.searchIndexBaseUrl}${hashHex}.js`, {
            rn_: value => callbacks.rn_(value),
        }).catch(error => callbacks.err_rn_(hashHex, error));
    }

    loadDataByNameAndHash(name, hashHex) {
        const callbacks = this.requireCallbacks();
        this.loadCallbackScript(`${this.searchIndexBaseUrl}${name}/${hashHex}.js`, {
            rd_: value => callbacks.rd_(value),
            rb_: value => callbacks.rb_(value),
        }).catch(error => callbacks.err_rd_(hashHex, error));
    }

    requireCallbacks() {
        if (!this.callbacks) {
            throw new Error("rustdoc search callbacks are not initialized");
        }
        return this.callbacks;
    }

    async loadCallbackScript(url, handlers) {
        let called = false;
        const callbackNames = Object.keys(handlers);
        const callbackFns = callbackNames.map(name => {
            return (...args) => {
                called = true;
                handlers[name](...args);
            };
        });

        executeCallbackScript(await fetchText(url), url, callbackNames, callbackFns);
        if (!called) {
            throw new Error(`Rustdoc index script did not call expected callback: ${url}`);
        }
    }
}

async function collectResults(generator) {
    const results = [];
    for await (const result of generator) {
        const item = result.item || {};
        results.push({
            href: result.href,
            displayPath: result.displayPath,
            name: item.name || result.name || "",
            ty: item.ty,
            crate: item.crate,
            desc: await result.desc,
        });
        if (results.length >= MAX_RESULTS) {
            break;
        }
    }
    return results;
}

async function fetchText(url) {
    if (!sourceTextPromises.has(url)) {
        const promise = requestSourceText({ url });
        sourceTextPromises.set(url, promise);
        promise.catch(() => sourceTextPromises.delete(url));
    }
    return await sourceTextPromises.get(url);
}

async function fetchExtensionText(extensionPath) {
    const cacheKey = `extension:${extensionPath}`;
    if (!sourceTextPromises.has(cacheKey)) {
        const promise = requestSourceText({ extensionPath });
        sourceTextPromises.set(cacheKey, promise);
        promise.catch(() => sourceTextPromises.delete(cacheKey));
    }
    return await sourceTextPromises.get(cacheKey);
}

function requestSourceText(request) {
    const id = nextSourceRequestId++;
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            cleanup();
            reject(new Error("Timed out loading rustdoc search script source"));
        }, REQUEST_TIMEOUT_MS);

        const onMessage = event => {
            const message = event.data;
            if (message?.target !== SOURCE_TARGET || message.id !== id) {
                return;
            }

            cleanup();
            if (message.ok) {
                resolve(message.source);
            } else {
                reject(new Error(message.error || "Failed to load rustdoc search script source"));
            }
        };

        const cleanup = () => {
            clearTimeout(timer);
            window.removeEventListener("message", onMessage);
        };

        window.addEventListener("message", onMessage);
        window.parent.postMessage({
            target: SOURCE_TARGET,
            id,
            ...request,
        }, "*");
    });
}

function executeSearchCore(source, url) {
    const execute = new Function(`${source}\nreturn initSearch;\n//# sourceURL=${url}`);
    const loadedInitSearch = execute.call(window);
    if (typeof loadedInitSearch !== "function") {
        throw new Error("Invalid rustdoc search core script");
    }
    return loadedInitSearch;
}

function executeScript(source, url) {
    const execute = new Function(`${source}\n//# sourceURL=${url}`);
    execute.call(window);
}

function executeCallbackScript(source, url, callbackNames, callbackFns) {
    const execute = new Function(...callbackNames, `${source}\n//# sourceURL=${url}`);
    execute.call(window, ...callbackFns);
}
