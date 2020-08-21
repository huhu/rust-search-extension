document.addEventListener("DOMContentLoaded", () => {
    injectScripts(["script/add-nightly-search-index.js"]);
});

window.addEventListener("message", function (event) {
    if (event.source === window &&
        event.data &&
        event.data.direction === "rust-search-extension:nightly") {
        chrome.runtime.sendMessage({action: "nightly:add", ...event.data.message},
            (response) => {
                console.log(response);
            }
        );
    }
});