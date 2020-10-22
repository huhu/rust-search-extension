window.addEventListener("message", function (event) {
    if (event.source === window &&
        event.data &&
        event.data.direction === "rust-search-extension:update-index") {
        chrome.runtime.sendMessage({action: `index-update:${event.data.message.target}`, ...event.data.message},
            (response) => {
                console.log(response);
            }
        );
    }
});