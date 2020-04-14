async function parseCargoFeatures(content) {
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