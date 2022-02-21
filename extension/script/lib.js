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
            let match = line.match(/\[dependencies\.(.+)\]/);
            if (match) {
                currentCrate = match[1];
            } else if (/optional = true/g.test(line)) {
                if (currentCrate) {
                    dependencies.push(currentCrate);
                    currentCrate = null;
                }
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