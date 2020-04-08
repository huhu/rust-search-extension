const homepage = "https://rust-search-extension.now.sh";
chrome.runtime.onInstalled.addListener((installReason) => {
    if (installReason.reason === 'update') {
        chrome.tabs.create({url: `${homepage}/changelog/`});
    }
});

let fileNewIssue = "title=Have you found a bug? Did you feel something was missing?&body=Whatever it was, we'd love to hear from you.";
chrome.runtime.setUninstallURL(
    `https://github.com/Folyd/rust-search-extension/issues/new?${encodeURI(fileNewIssue)}`
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("message :", message);
    switch (message.action) {
        case "check": {
            console.log("message check");
            sendResponse({added: message.crateName in CrateDocSearchManager.getCrates()});
            break;
        }
        case "remove": {
            CrateDocSearchManager.removeCrate(message.crateName);
            sendResponse(true);
            break;
        }
    }
    return true;
});

chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    CrateDocSearchManager.addCrate(request.crateName, request.crateVersion, request.searchIndex);
    console.log(request);
    sendResponse("ok");
    return true;
});