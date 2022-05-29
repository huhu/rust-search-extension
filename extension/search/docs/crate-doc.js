// A DocSearch dedicated to a single crate based on the search-index.
class SingleCrateDocSearch extends DocSearch {

    constructor(name, version, searchIndex) {
        super(name, searchIndex, () => {
            return `https://docs.rs/${name}/${version}/`;
        });
    }
}

// Search all crate's docs, including `@` sigil and `~` sigil,.
class CrateDocSearch {
    constructor() {
        this.cachedCrateSearcher = null;
        this.allCrateSearcher = null;
    }

    initAllCrateSearcher() {
        let searchIndex = {};
        Object.keys(CrateDocManager.getCrates()).forEach(crateName => {
            searchIndex = Object.assign(searchIndex, CrateDocManager.getCrateSearchIndex(crateName));
        });
        this.allCrateSearcher = new SingleCrateDocSearch("~", "*", searchIndex);
    }

    // Search specific crate docs by prefix `@` sigil.
    // If that crate not been indexed, fallback to the list of all indexed crates.
    search(query) {
        let [crateName, keyword] = CrateDocSearch.parseCrateDocsSearchKeyword(query);

        let searcher = null;
        if (this.cachedCrateSearcher && this.cachedCrateSearcher.name === crateName) {
            searcher = this.cachedCrateSearcher;
        } else {
            let crates = CrateDocManager.getCrates();
            let crate = crates[crateName];
            if (crate) {
                let searchIndex = CrateDocManager.getCrateSearchIndex(crateName);
                searcher = new SingleCrateDocSearch(crateName, crate.version, searchIndex);

                this.cachedCrateSearcher = searcher;
            } else {
                let list = Object.entries(crates).map(([name, crate]) => {
                    crate["name"] = name;
                    return crate;
                });

                list = list.filter(item => !crateName || item.name.toLowerCase().indexOf(crateName) > -1)
                    .sort((a, b) => a.name.localeCompare(b.name));
                if (list.length > 0) {
                    list.unshift({
                        content: crateName, // Non-empty value is required for content, so maybe give it a crate name.
                        description: `Following ${list.length} crate(s) were indexed by you, select one to search their docs exclusively.`
                    });
                } else {
                    list.unshift({
                        content: `https://docs.rs/${crateName}/?search=${encodeURIComponent(keyword)}`,
                        description: `Crate ${c.match(crateName)} has not been indexed, search ${keyword ? c.match(keyword) : 'keyword'} on ${c.dim(`https://docs.rs/${crateName}`)} directly`,
                    });
                }
                return list;
            }
        }

        let results = searcher.search(keyword);
        // Push result footer.
        results.push({
            content: searcher.getSearchUrl(keyword),
            description: `Search ${keyword ? c.match(keyword) : 'keyword'} on ${c.dim(`https://docs.rs/${crateName}`)} directly`,
        });
        return results;
    }

    // Search all saved crates docs collectively.
    searchAll(query) {
        if (!this.allCrateSearcher) {
            this.initAllCrateSearcher();
        }
        let keyword = query.replace("~", "").trim();
        return this.allCrateSearcher.search(keyword);
    }

    static parseCrateDocsSearchKeyword(query) {
        query = query.replaceAll("@", "").trim();
        let [crateName, ...keyword] = query.split(/\s|:+/i);
        return [crateName, keyword.filter(k => k).join('::')];
    }
}

