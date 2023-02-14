document.addEventListener("DOMContentLoaded", () => {
    // Ignore all non-rust doc pages.
    if (!isRustDoc()) return;

    // rustc search index is a memory cache, therefore we don't use localStorage
    // to store the cached-version. Instead, we use `rustc:check` action.
    chrome.runtime.sendMessage({ action: "rustc:check" },
        response => {
            let now = new Date();
            let today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            if (response?.version && today <= Date.parse(response.version)) {
                // Check version to ensure update search index once a day.
                return;
            }
            injectScripts(["script/add-search-index.js"]);
        }
    );
});

window.addEventListener("message", function (event) {
    if (event.source === window &&
        event.data &&
        event.data.direction === "rust-search-extension:rustc") {
        console.log(event.data);
        let now = new Date();
        let version = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
        // rustc search index is a memory cache, therefore we don't use localStorage
        // to store the cached-version. Instead, we use `rustc:check` action, see above.
        chrome.runtime.sendMessage({ action: "rustc:add", version, ...event.data.message },
            (response) => {
                console.log(response);
            }
        );
    }
});