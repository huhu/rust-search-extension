let target = location.pathname.includes("/nightly/") ? "nightly" : "stable";

document.addEventListener("DOMContentLoaded", () => {
    let version = localStorage.getItem(`rust-search-extension:${target}`);
    let now = new Date();
    let today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    if (version && today <= Date.parse(version)) {
        // Check version between localStorage and today to ensure update search index once a day.
        return;
    }
    injectScripts(["script/add-std-search-index.js"]);
});

window.addEventListener("message", function (event) {
    if (event.source === window &&
        event.data &&
        event.data.direction === "rust-search-extension:std") {
        chrome.runtime.sendMessage({action: `${target}:add`, ...event.data.message},
            (response) => {
                let now = new Date();
                let version = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
                localStorage.setItem(`rust-search-extension:${target}`, version);
                console.log(version);
            }
        );
    }
});