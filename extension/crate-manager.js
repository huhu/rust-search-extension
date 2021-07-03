class CrateDocManager {
    static getCrates() {
        return JSON.parse(localStorage.getItem("crates") || "{}");
    }

    static getCrateSearchIndex(name) {
        return JSON.parse(localStorage.getItem(`@${name}`));
    }

    static addCrate(name, version, searchIndex) {
        if (searchIndex.hasOwnProperty(name)) {
            localStorage.setItem(`@${name}`, JSON.stringify(searchIndex));
            let doc = searchIndex[name]["doc"];
            let crates = CrateDocManager.getCrates();
            crates[name] = { version, doc, time: Date.now() };
            localStorage.setItem("crates", JSON.stringify(crates));
        }
    }

    static removeCrate(name) {
        let crates = CrateDocManager.getCrates();
        delete crates[name];
        localStorage.setItem("crates", JSON.stringify(crates));
        localStorage.removeItem(`@${name}`);
    }
}