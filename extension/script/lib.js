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

function parseCargoFeatures(content) {
    let features = [];

    let start = content.lastIndexOf("[features]");
    if (start !== -1) {
        let lines = content.slice(start + "[features]\n".length).split("\n");
        for (let line of lines) {
            if (/.* = \[.*]/g.test(line)) {
                let [name, flags] = line.split("=");
                flags = flags.trim().replace(/"/ig, "");
                features.push([name.trim(), flags]);
            } else {
                break;
            }
        }
    }
    return features;
}

/**
 * Parse optional dependecies from Cargo.tom HTML page.
 * 
 * @param {*} content HTML page of Cargo.toml content
 * @returns the list of optional dependencies
 */
function parseOptionalDependencies(content) {
    let dependencies = [];
    let start = content.indexOf("[dependencies.");
    if (start !== -1) {
        let lines = content.slice(start).split("\n");
        let currentCrate = null;
        for (let line of lines) {
            let match = line.match(/\[dependencies\.(.+)]/);
            if (match) {
                currentCrate = match[1];
            } else if (currentCrate && /optional = true/g.test(line)) {
                dependencies.push(currentCrate);
                currentCrate = null;
            } else if (line.startsWith("[dev-dependencies.")) {
                break;
            }
        }
    }

    return dependencies;
}

function injectScripts(paths) {
    paths.map(path => {
        let script = document.createElement("script");
        script.src = chrome.runtime.getURL(path);
        script.onload = () => {
            // Remove self after loaded
            script.remove();
        };
        return script;
    }).forEach(script => {
        document.body.insertAdjacentElement('beforeBegin', script);
    });
}