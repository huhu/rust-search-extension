// Wrap chrome.storage API as a promise.
// See https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/StorageArea/get
function getIndexInternal(key) {
    return new Promise(resolve => {
        chrome.storage.local.get(key, (result) => {
            resolve(result[key]);
        });
    });
}

// Query all storage by this method:
// chrome.storage.local.get(null, function(result) {
//     console.log('Value currently is ', result);
// });
class IndexManager {
    static async getStdStableIndex() {
        return await getIndexInternal('index-std-stable') || searchIndex;
    }

    static setStdStableIndex(index) {
        chrome.storage.local.set({'index-std-stable': index});
    }

    static async getStdNightlyIndex() {
        return await getIndexInternal('index-std-nightly') || searchIndex;
    }

    static setStdNightlyIndex(index) {
        chrome.storage.local.set({'index-std-nightly': index});
    }

    static async getBookIndex() {
        return await getIndexInternal('index-book') || booksIndex;
    }

    static setBookIndex(index) {
        chrome.storage.local.set({'index-book': index});
    }

    static async getLabelIndex() {
        return await getIndexInternal('index-label') || labelsIndex;
    }

    static setLabelIndex(index) {
        chrome.storage.local.set({'index-label': index});
    }

    static async getCrateMapping() {
        return await getIndexInternal('index-crate-mapping') || mapping;
    }

    static setCrateMapping(index) {
        chrome.storage.local.set({'index-crate-mapping': index});
    }

    static async getCrateIndex() {
        return await getIndexInternal('index-crate') || crateIndex;
    }

    static setCrateIndex(index) {
        chrome.storage.local.set({'index-crate': index});
    }

    static async getLintIndex() {
        return await getIndexInternal('index-lint') || lintsIndex;
    }

    static setLintIndex(index) {
        chrome.storage.local.set({'index-lint': index});
    }

    static async getCaniuseIndex() {
        return await getIndexInternal('index-caniuse') || caniuseIndex;
    }

    static setCaniuseIndex(index) {
        chrome.storage.local.set({'index-caniuse': index});
    }

    static async getCommandIndex() {
        let index = await getIndexInternal('index-command');
        if (index) {
            // commandsIndex would update if the new version installed.
            // So we should override the old cache one.
            if (Object.keys(index).length < Object.keys(commandsIndex).length) {
                this.setCommandIndex(commandsIndex);
                return commandsIndex;
            }
            return index;
        }
        return commandsIndex;
    }

    static setCommandIndex(index) {
        chrome.storage.local.set({'index-command': index});
    }
}