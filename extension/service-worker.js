import { Omnibox, Compat } from "./core/index.js";
import settings from "./settings.js";
import { start } from "./main.js";

async function checkAutoUpdate() {
    if (await settings.autoUpdate) {
        let version = await storage.getItem('auto-update-version');
        let now = new Date();
        let today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        if (version && today <= Date.parse(version)) {
            // Check version between localStorage and today to ensure open update page once a day.
            return;
        }

        Omnibox.navigateToUrl(INDEX_UPDATE_URL);
        await storage.setItem('auto-update-version', `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`);
    }
}

const chromeAction = chrome.action || chrome.browserAction;
chromeAction.onClicked.addListener(() => {
    let managePage = chrome.runtime.getURL("manage/index.html");
    chrome.tabs.create({ url: managePage });
});

chrome.runtime.onInstalled.addListener(async ({ previousVersion, reason }) => {
    const manifest = chrome.runtime.getManifest();
    if (reason === "update" && previousVersion !== manifest.version) {
        IndexManager.updateAllIndex();
        console.log(`New version updated! Previous version: ${previousVersion}, new version: ${manifest.version}`);
    }
});

// DO NOT USE ASYNC CALLBACK HERE, SEE THIS ISSUE:
// https://github.com/mozilla/webextension-polyfill/issues/130#issuecomment-918076049
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case "open-url": {
            if (message.url) {
                Omnibox.navigateToUrl(message.url);
            }
            break;
        }
    }
    return true;
});

(async () => {
    const defaultSuggestion = `Search std <match>docs</match>, external <match>docs</match> (~,@), <match>crates</match> (!), <match>attributes</match> (#), <match>books</match> (%), clippy <match>lints</match> (>), and <match>error codes</match>, etc in your address bar instantly!`;
    const omnibox = Omnibox.extension({ defaultSuggestion, maxSuggestionSize: Compat.omniboxPageSize() });
    await start(omnibox);
    await checkAutoUpdate();
})();
