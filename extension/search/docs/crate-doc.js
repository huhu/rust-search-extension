class CrateDocSearch extends DocSearch {
    constructor(name, version, searchIndex) {
        super(searchIndex, `https://docs.rs/${name}/${version}/`);
    }
}

class CrateDocSearchManager {
    constructor() {
        this.cachedCrate = null;
        this.cachedCrateSearcher = null;
    }

    search(query) {
        query = query.replace("@", "").trim();
        let [crateName, keyword] = query.split(" ");

        let crates = CrateDocSearchManager.getCrates();
        let searcher = null;
        if (this.cachedCrate === crateName) {
            searcher = this.cachedCrateSearcher;
        } else {
            let crate = crates[crateName];
            if (crate) {
                let searchIndex = CrateDocSearchManager.getCrateSearchIndex(crateName);
                searcher = new CrateDocSearch(crateName, crate.version, searchIndex);
                this.cachedCrate = crate;
                this.cachedCrateSearcher = searcher;
                return searcher.search(keyword);
            } else {
                return [];
            }
        }

        return searcher.search(keyword);
    }

    static getCrates() {
        return JSON.parse(localStorage.getItem("crates") || "{}");
    }

    static getCrateSearchIndex(name) {
        return JSON.parse(localStorage.getItem(`@${name}`));
    }

    static addCrate(name, version, searchIndex) {
        localStorage.setItem(`@${name}`, JSON.stringify(searchIndex));
        let doc = searchIndex[name]["doc"];
        let crates = CrateDocSearchManager.getCrates();
        crates[name] = {version, doc, time: Date.now()};
        localStorage.setItem("crates", JSON.stringify(crates));
    }

    static removeCrate(name) {
        let crates = CrateDocSearchManager.getCrates();
        delete crates[name];
        localStorage.setItem("crates", JSON.stringify(crates));
        localStorage.removeItem(`${name}`);
    }
}