class CrateDocManager {
    static async getCrates() {
        return await storage.getItem("crates") || {};
    }

    static async getCrateSearchIndex(name) {
        return await storage.getItem(`@${name}`);
    }

    static async addCrate(name, version, searchIndex) {
        if (searchIndex.hasOwnProperty(name)) {
            await storage.setItem(`@${name}`, searchIndex);
            let doc = searchIndex[name]["doc"];
            let crates = await CrateDocManager.getCrates();
            if (name in crates) {
                // Don't override the time if the crate exists
                crates[name] = {version, doc, time: crates[name].time};
            } else {
                crates[name] = {version, doc, time: Date.now()};
            }
            await storage.setItem("crates", crates);
        }
    }

    static async removeCrate(name) {
        let crates = await CrateDocManager.getCrates();
        delete crates[name];
        await storage.setItem("crates", crates);
        await storage.removeItem(`@${name}`);
    }
}