class CrateDocSearch extends DocSearch {
    constructor({name, version, searchIndex}) {
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

        let searcher = null;
        if (this.cachedCrate === crateName) {
            searcher = this.cachedCrateSearcher;
        } else {
            let crate = CrateDocSearchManager.getCrate(crateName);
            if (crate) {
                searcher = new CrateDocSearch(crate);
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
        return JSON.parse(localStorage.getItem("crates") || "[]");
    }

    static checkCrate(name) {
        let crates = CrateDocSearchManager.getCrates();
        return crates.find(item => item.name === name);
    }

    static getCrate(name) {
        let crate = CrateDocSearchManager.checkCrate(name);
        if (crate) {
            crate["searchIndex"] = JSON.parse(localStorage.getItem(`${name}`));
            return crate;
        } else {
            return null;
        }
    }

    static addCrate(name, version, searchIndex) {
        localStorage.setItem(name, JSON.stringify(searchIndex));
        let crates = CrateDocSearchManager.getCrates();
        crates.push({name, version});
        localStorage.setItem("crates", JSON.stringify(crates));
    }

    static removeCrate(name) {
        let crates = CrateDocSearchManager.getCrates();
        let index = crates.findIndex(item => item.name === name);
        if (index > -1) {
            crates.splice(index);
        }
        localStorage.setItem("crates", JSON.stringify(crates));
        localStorage.removeItem(`${name}`);
    }
}