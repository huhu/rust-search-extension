class CrateDocManager {
    static async getCrates() {
        return await storage.getItem("crates") || {};
    }

    static getCrateSearchIndex(name) {
        return storage.getItem(`@${name}`);
    }

    static addCrate(name, version, searchIndex) {
        if (searchIndex.hasOwnProperty(name)) {
            storage.setItem(`@${name}`, searchIndex);
            let doc = searchIndex[name]["doc"];
            let crates = CrateDocManager.getCrates();
            if (name in crates) {
                // Don't override the time if the crate exists
                crates[name] = { version, doc, time: crates[name].time };
            } else {
                crates[name] = { version, doc, time: Date.now() };
            }
            storage.setItem("crates", crates);
        }
    }

    static removeCrate(name) {
        let crates = CrateDocManager.getCrates();
        delete crates[name];
        storage.setItem("crates", crates);
        storage.removeItem(`@${name}`);
    }
}