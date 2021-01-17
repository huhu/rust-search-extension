document.addEventListener("DOMContentLoaded", () => {
    chrome.runtime.sendMessage({action: "rustc:check"},
        response => {
            let now = new Date();
            let today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            if (response && response.version && today <= Date.parse(response.version)) {
                // Check version to ensure update search index once a day.
                return;
            }
            injectScripts(["script/add-rustc-search-index.js"]);
        }
    );
});

window.addEventListener("message", function (event) {
    console.log(event.data);
    if (event.source === window &&
        event.data &&
        event.data.direction === "rust-search-extension:rustc") {
        let now = new Date();
        let version = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
        chrome.runtime.sendMessage({action: "rustc:add", version, ...event.data.message},
            (response) => {
                console.log(response);
            }
        );
    }
});