document.addEventListener("DOMContentLoaded", () => {
    let p = document.querySelector('nav.sidebar>div.version>p');

    let nightlyVersion = p.textContent.match(/\d{4}-\d{1,2}-\d{1,2}/)[0];

    chrome.runtime.sendMessage({nightlyVersion, action: "nightly:check"}, response => {
        console.log('response:', response);
        if (response.state !== 'latest') {
            injectScripts(["script/add-nightly-search-index.js"]);
        }
    });
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