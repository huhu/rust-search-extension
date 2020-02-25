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