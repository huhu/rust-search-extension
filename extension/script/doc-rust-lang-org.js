let target = location.pathname.includes("/nightly/") ? "nightly" : "stable";

document.addEventListener("DOMContentLoaded", () => {
    injectScripts(["script/add-std-search-index.js"]);
});

window.addEventListener("message", function (event) {
    if (event.source === window &&
        event.data &&
        event.data.direction === "rust-search-extension:std") {
        chrome.runtime.sendMessage({action: `${target}:add`, ...event.data.message},
            (response) => {
                console.log(response);
            }
        );
    }
});