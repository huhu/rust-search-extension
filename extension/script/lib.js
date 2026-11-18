// Returns `true` if the document's generator is "rustdoc"
function isRustDoc() {
    let gen = document.querySelector('head > meta[name="generator"]');
    return gen && gen.getAttribute('content') === 'rustdoc';
}

// Since this PR (https://github.com/rust-lang/docs.rs/pull/1527) merged,
// the latest version path has changed:
// from https://docs.rs/tokio/1.14.0/tokio/ to https://docs.rs/tokio/latest/tokio/
//
// If we parse the crate version from url is 'latest',
// we should reparse it from the DOM to get the correct value.
function parseCrateVersionFromDOM(crate) {
    const title = document.querySelector("form .crate-name>.title")?.textContent?.trim();
    return title?.startsWith(`${crate}-`) ? title.slice(crate.length + 1) : null;
}

function parseCrateTitleFromDOM() {
    let el = document.querySelector('form a.crate-name');
    return el?.getAttribute("title")?.slice(0, 100) ?? null;
}

function parseCargoFeatures(content) {
    if (!content.version?.features) {
        return [];
    }
    let features = [];

    function to_string(flags) {
        return "[" + flags.map(i => '"' + i.toString() + '"').join(', ') + "]"
    }

    for (const [name, flags] of Object.entries(content.version.features)) {
        if (name === "default") {
            features.unshift([name, to_string(flags)]);
        } else {
            features.push([name, to_string(flags)]);
        }
    }
    return features;
}

/**
 * Parse optional dependecies from crates.io API result.
 *
 * @returns the list of optional dependencies
 */
function parseOptionalDependencies(content) {
    let dependencies = [];
    for (let dep of content.dependencies) {
        if (dep.optional) {
            dependencies.push(dep.crate_id);
        }
    }
    return dependencies;
}

function loadScript({ url, loadCallback, errorCallback }) {
    const script = document.createElement("script");
    script.src = url;
    if (loadCallback !== undefined) {
        script.onload = loadCallback
    }
    if (errorCallback !== undefined) {
        script.onerror = errorCallback
    }
    document.head.append(script)
}

function injectScripts(...paths) {
    paths.forEach(path => {
        console.log(`Loading script: ${path}`);
        loadScript({ url: chrome.runtime.getURL(path) });
    });
}

function getRustdocVar(name) {
    const vars = document.querySelector("head > meta[name='rustdoc-vars']") ||
        document.getElementById("rustdoc-vars");
    return vars?.getAttribute(`data-${name}`) ?? null;
}

function loadRustdocScript(url) {
    return new Promise((resolve, reject) => {
        loadScript({
            url,
            loadCallback: resolve,
            errorCallback: () => reject(new Error(`Could not load ${url}`)),
        });
    });
}

async function importRustdocIndex() {
    if (getRustdocVar("stringdex-js")) {
        const rootPath = getRustdocVar("root-path") ?? "";
        const suffix = getRustdocVar("resource-suffix") ?? "";
        const url = new URL(`${rootPath}search.index/root${suffix}.js`, document.baseURI);
        if (url.origin !== location.origin) throw new Error("Rustdoc index is on a different origin");
        return { searchIndex: await rse.loadRustdocSearchIndex(url) };
    }

    await loadRustdocScript(chrome.runtime.getURL("script/lib.js"));
    let listener;
    let timeout;
    try {
        const result = new Promise((resolve, reject) => {
            listener = event => {
                if (event.source !== window || event.origin !== location.origin ||
                    event.data?.direction !== "rust-search-extension:rustdoc-index") return;
                const { message, error } = event.data;
                if (error) reject(new Error(error));
                else resolve(message);
            };
            window.addEventListener("message", listener);
            timeout = setTimeout(() => reject(new Error("Rustdoc index import timed out")), 30_000);
        });
        const [, index] = await Promise.all([
            loadRustdocScript(chrome.runtime.getURL("script/add-search-index.js")),
            result,
        ]);
        return index;
    } finally {
        clearTimeout(timeout);
        window.removeEventListener("message", listener);
    }
}
