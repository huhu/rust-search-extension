document.addEventListener("DOMContentLoaded", () => {
    let version = localStorage.getItem(`rust-search-extension:rustc`);
    let now = new Date();
    let today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    if (version && today <= Date.parse(version)) {
        // Check version between localStorage and today to ensure update search index once a day.
        return;
    }
    injectScripts(["script/add-rustc-search-index.js"]);
});

window.addEventListener("message", function (event) {
    console.log(event.data);
    if (event.source === window &&
        event.data &&
        event.data.direction === "rust-search-extension:rustc") {
        chrome.runtime.sendMessage({action: "rustc:add", ...event.data.message},
            (response) => {
                let now = new Date();
                let version = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
                localStorage.setItem(`rust-search-extension:rustc`, version);
                console.log(response);
            }
        );
    }
});