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
function parseCrateVersionFromDOM() {
    let versionText = document.querySelector('form .crate-name>.title').textContent;
    if (versionText) {
        // The form of versionText is {crateName}-{version}, separated by hypen, e.g. 'tokio-1.7.0',
        // However, the crate name could contains hypen too, such as 'tracing-subscriber-0.3.9'.
        let lastHypenIndex = versionText.lastIndexOf('-');
        return versionText.substring(lastHypenIndex + 1);
    } else {
        return null;
    }
}

function parseCrateTitleFromDOM() {
    let el = document.querySelector('form a.crate-name');
    if (el) {
        return el.getAttribute("title").substring(0, 100);
    } else {
        return null;
    }
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
