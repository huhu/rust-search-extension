import DocSearch from "./base.js";
import CrateDocManager from "../../crate-manager.js";
import settings from "../../settings.js";
import DescShardManager from "./desc-shard.js";
import OnDemandCrateDocSearch from "./on-demand-crate-doc.js";

// Search all crate's docs, including `@` sigil and `~` sigil,.
export default class CrateDocSearch {
    constructor() {
        this.cachedCrateSearcher = null;
        this.allCrateSearcher = null;
        this.allOnDemandCrateSearchers = null;
    }

    async initAllCrateSearcher() {
        let searchIndex = new Map();
        let descShards = new DescShardManager();
        this.allOnDemandCrateSearchers = [];
        for (const [libName, crate] of Object.entries(await CrateDocManager.getCrates())) {
            const crateMetadata = { libName, ...crate };
            if (OnDemandCrateDocSearch.isSupported(crateMetadata)) {
                this.allOnDemandCrateSearchers.push(new OnDemandCrateDocSearch(crateMetadata));
                continue;
            }

            let crateSearchIndex = await CrateDocManager.getCrateSearchIndex(libName);
            if (crateSearchIndex) {
                // merge search index into single map
                searchIndex = new Map([...searchIndex, ...crateSearchIndex]);
            }
            await descShards.addCrateDescShards(libName);
        }
        this.allCrateSearcher = searchIndex.size > 0 ?
            new DocSearch("~", searchIndex, "https://docs.rs/~/*/", descShards) :
            null;
    }

    // Search specific crate docs by prefix `@` sigil.
    // If that crate not been indexed, fallback to the list of all indexed crates.
    async search(query) {
        let [crateName, keyword] = CrateDocSearch.parseCrateDocsSearchKeyword(query);

        let searcher = null;
        if (this.cachedCrateSearcher?.name === crateName) {
            searcher = this.cachedCrateSearcher;
            if (searcher instanceof OnDemandCrateDocSearch) {
                if (await settings.keepCratesUpToDate) {
                    const refreshedCrate = await this.getCrateSearchMetadata(crateName);
                    if (refreshedCrate && OnDemandCrateDocSearch.isSupported(refreshedCrate)) {
                        searcher.updateMetadata(refreshedCrate);
                    }
                }
            } else {
                searcher.version = await settings.keepCratesUpToDate ? "latest" : searcher.version;
            }
        } else {
            let crate = await this.getCrateSearchMetadata(crateName);
            if (crate) {
                if (OnDemandCrateDocSearch.isSupported(crate)) {
                    searcher = new OnDemandCrateDocSearch(crate);
                } else {
                    let searchIndex = await CrateDocManager.getCrateSearchIndex(crateName);
                    const crateVersion = await settings.keepCratesUpToDate ? "latest" : crate.version;
                    searcher = new DocSearch(
                        crateName,
                        searchIndex,
                        `https://docs.rs/${crateName}/${crateVersion}/`,
                        await DescShardManager.create(crateName),
                    );
                }

                this.cachedCrateSearcher = searcher;
            } else {
                let crates = await CrateDocManager.getCrates();
                let list = Object.entries(crates).map(([libName, crate]) => {
                    crate["name"] = crate.crateName || libName;
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
                        content: `https://docs.rs/${crateName}/latest/?search=${encodeURIComponent(keyword)}`,
                        description: `Crate <match>${crateName}</match> has not been indexed, search ${keyword ? `<match>${keyword}</match>` : 'keyword'} on <dim>${`https://docs.rs/${crateName}`}</dim> directly`,
                    });
                }
                return list;
            }
        }

        let results = await searcher.search(keyword);
        // Push result footer.
        results.push({
            content: await searcher.getSearchUrl(keyword),
            description: `Search ${keyword ? `<match>${keyword}</match>` : 'keyword'} on <dim>${`https://docs.rs/${crateName}`}</dim> directly`,
        });
        return results;
    }

    // Search all saved crates docs collectively.
    async searchAll(query) {
        if (!this.allCrateSearcher && !this.allOnDemandCrateSearchers) {
            await this.initAllCrateSearcher();
        }
        let keyword = query.replaceAll("~", "").trim();
        const onDemandResults = await CrateDocSearch.searchOnDemandCrates(
            this.allOnDemandCrateSearchers || [],
            keyword,
        );
        const legacyResults = this.allCrateSearcher ?
            await this.allCrateSearcher.search(keyword) :
            [];
        return [...onDemandResults.flat(), ...legacyResults].slice(0, 200);
    }

    // Invalidate cached search. This is needed if we update crate's search index.
    invalidateCachedSearch() {
        this.cachedCrateSearcher = null;
        this.allCrateSearcher = null;
        this.allOnDemandCrateSearchers = null;
    }

    async getCrateSearchMetadata(crateName) {
        let crate = await CrateDocManager.getCrateSearchMetadata(crateName);
        if (!crate) {
            return null;
        }

        if (await settings.keepCratesUpToDate) {
            try {
                const refreshedCrate = await CrateDocManager.updateCrateSearchMetadataFromDocsRs(crateName);
                if (refreshedCrate) {
                    return refreshedCrate;
                }
            } catch (error) {
                console.error(`Failed to update ${crateName} crate docs metadata from docs.rs:`, error);
            }
            crate = {
                ...crate,
                rootPath: `https://docs.rs/${crate.crateName || crate.libName}/latest/`,
            };
        }
        return crate;
    }

    static parseCrateDocsSearchKeyword(query) {
        query = query.replaceAll("@", "").trim();
        let [crateName, ...keyword] = query.split(/\s/i);
        return [crateName, keyword.filter(k => k).join('')];
    }

    static async searchOnDemandCrates(searchers, keyword) {
        const concurrency = 2;
        const results = new Array(searchers.length);
        let nextIndex = 0;

        async function worker() {
            while (nextIndex < searchers.length) {
                const index = nextIndex;
                nextIndex += 1;
                const searcher = searchers[index];
                try {
                    results[index] = await searcher.search(keyword);
                } catch (error) {
                    console.error("Failed to search crate docs:", searcher.libName, error);
                    results[index] = [];
                }
            }
        }

        await Promise.all(
            Array.from(
                { length: Math.min(concurrency, searchers.length) },
                () => worker(),
            ),
        );
        return results;
    }
}
