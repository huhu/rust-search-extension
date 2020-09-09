document.addEventListener("DOMContentLoaded", () => {
    injectScripts(["script/add-std-search-index.js"]);
});

window.addEventListener("message", function (event) {
    if (event.source === window &&
        event.data &&
        event.data.direction.startsWith("rust-search-extension:")) {
        let [_, target] = event.data.direction.split(":");
        chrome.runtime.sendMessage({action: `${target}:add`, ...event.data.message},
            (response) => {
                console.log(response);
            }
        );
    }
});