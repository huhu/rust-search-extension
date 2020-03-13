const homepage = "https://rust-search-extension.now.sh";
c.browser.runtime.onInstalled.addListener((installReason) => {
    if (installReason.reason === 'update') {
        c.browser.tabs.create({url: `${homepage}/changelog/`});
    }
});

let fileNewIssue = "title=Have you found a bug? Did you feel something was missing?&body=Whatever it was, we'd love to hear from you.";
c.browser.runtime.setUninstallURL(
    `https://github.com/Folyd/rust-search-extension/issues/new?${encodeURI(fileNewIssue)}`
);

c.browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case "check": {
            sendResponse({added: request.crateName in CrateDocSearchManager.getCrates()});
            break;
        }
        case "remove": {
            CrateDocSearchManager.removeCrate(request.crateName);
            sendResponse(true);
            break;
        }
    }
    return true;
});

c.browser.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    CrateDocSearchManager.addCrate(request.crateName, request.crateVersion, request.searchIndex);
    console.log(request);
    sendResponse("ok");
    return true;
});