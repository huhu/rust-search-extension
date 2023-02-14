// Query all storage by this method:
// chrome.storage.local.get(null, function(result) {
//     console.log('Value currently is ', result);
// });

class IndexManager {
    static async getStdStableIndex() {
        return await storage.getItem('index-std-stable') || searchIndex;
    }

    static setStdStableIndex(index) {
        storage.setItem('index-std-stable', index);
    }

    static async getStdNightlyIndex() {
        return await storage.getItem('index-std-nightly') || searchIndex;
    }

    static setStdNightlyIndex(index) {
        storage.setItem('index-std-nightly', index);
    }

    static async getBookIndex() {
        return await storage.getItem('index-book') || booksIndex;
    }

    static setBookIndex(index) {
        storage.setItem('index-book', index);
    }

    static async getLabelIndex() {
        return await storage.getItem('index-label') || labelsIndex;
    }

    static setLabelIndex(index) {
        storage.setItem('index-label', index);
    }

    static async getRfcIndex() {
        return await storage.getItem('index-rfc') || rfcsIndex;
    }

    static setRfcIndex(index) {
        storage.setItem('index-rfc', index);
    }

    static async getCrateMapping() {
        return await storage.getItem('index-crate-mapping') || mapping;
    }

    static setCrateMapping(index) {
        storage.setItem('index-crate-mapping', index);
    }

    static async getCrateIndex() {
        return await storage.getItem('index-crate') || crateIndex;
    }

    static setCrateIndex(index) {
        storage.setItem('index-crate', index);
    }

    static async getLintIndex() {
        return await storage.getItem('index-lint') || lintsIndex;
    }

    static setLintIndex(index) {
        storage.setItem('index-lint', index);
    }

    static async getCaniuseIndex() {
        return await storage.getItem('index-caniuse') || caniuseIndex;
    }

    static setCaniuseIndex(index) {
        storage.setItem('index-caniuse', index);
    }

    static async getRustcIndex() {
        return await storage.getItem('index-rustc') || rustcIndex;
    }

    static setRustcIndex(index) {
        storage.setItem('index-rustc', index);
    }

    static async getTargetIndex() {
        return await storage.getItem('index-target') || targetsIndex;
    }

    static setTargetIndex(index) {
        storage.setItem('index-target', index);
    }

    static async getCommandIndex() {
        let index = await storage.getItem('index-command');
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
        storage.setItem('index-command', index);
    }

    static updateAllIndex() {
        IndexManager.setBookIndex(booksIndex);
        IndexManager.setCaniuseIndex(caniuseIndex);
        IndexManager.setCommandIndex(commandsIndex);
        IndexManager.setCrateIndex(crateIndex);
        IndexManager.setCrateMapping(mapping);
        IndexManager.setLabelIndex(labelsIndex);
        IndexManager.setLintIndex(lintsIndex);
        IndexManager.setRfcIndex(rfcsIndex);
        IndexManager.setRustcIndex(rustcIndex);
        IndexManager.setStdStableIndex(searchIndex);
        IndexManager.setTargetIndex(targetsIndex);
    }
}