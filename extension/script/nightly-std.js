document.addEventListener("DOMContentLoaded", () => {
    let p = document.querySelector('nav.sidebar>div.version>p');

    console.log("nightly std...", p.textContent);
});


window.addEventListener("message", function(event) {
    if (event.source === window &&
        event.data &&
        event.data.direction === "rust-search-extension:nightly") {
        chrome.runtime.sendMessage({action: "add", ...event.data.message},
            (response) => {
                console.log(response);
            }
        );
    }
});