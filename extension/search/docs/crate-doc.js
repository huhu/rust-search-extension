import DocSearch from "./base.js";
import CrateDocManager from "../../crate-manager.js";
import settings from "../../settings.js";
import DescShardManager from "./desc-shard.js";
import { isStringdexIndex } from "./rustdoc/index.js";

const ALL_CRATES_ROOT = "https://docs.rs/~/*/";

// Search saved crate docs with the `@` and `~` sigils.
export default class CrateDocSearch {
    constructor() {
        this.cachedCrateSearcher = null;
        this.allCrateSearchers = null;
    }

    async loadAllCrateSearchers() {
        const legacyIndex = new Map();
        const descShards = new DescShardManager();
        const searchers = [];
        for (const libName of Object.keys(await CrateDocManager.getCrates())) {
            const index = await CrateDocManager.getCrateSearchIndex(libName);
            if (isStringdexIndex(index)) {
                searchers.push(new DocSearch(libName, index, ALL_CRATES_ROOT, null, libName));
            } else if (index) {
                for (const [name, crateIndex] of index) {
                    legacyIndex.set(name, crateIndex);
                }
                await descShards.addCrateDescShards(libName);
            }
        }
        if (legacyIndex.size > 0) {
            searchers.unshift(new DocSearch("~", legacyIndex, ALL_CRATES_ROOT, descShards));
        }
        return searchers;
    }

    async search(query) {
        const [crateName, keyword] = CrateDocSearch.parseCrateDocsSearchKeyword(query);
        const entry = await CrateDocManager.getCrateEntry(crateName);
        if (!entry) return this.listCrates(crateName, keyword);

        const [libName, crate] = entry;
        const version = await settings.keepCratesUpToDate ? "latest" : crate.version;
        const root = `https://docs.rs/${crate.crateName || libName}/${version}/`;
        let searcher = this.cachedCrateSearcher;
        if (searcher?.name === libName) {
            searcher.setRootPath(root);
        } else {
            const index = await CrateDocManager.getCrateSearchIndex(libName);
            const descShards = isStringdexIndex(index) ? null : await DescShardManager.create(libName);
            searcher = new DocSearch(libName, index || new Map(), root, descShards, libName);
            this.cachedCrateSearcher = searcher;
        }

        const results = await searcher.search(keyword);
        results.push({
            content: await searcher.getSearchUrl(keyword),
            description: `Search ${keyword ? `<match>${keyword}</match>` : "keyword"} on <dim>${`https://docs.rs/${crateName}`}</dim> directly`,
        });
        return results;
    }

    async listCrates(crateName, keyword) {
        const crates = await CrateDocManager.getCrates();
        const list = Object.entries(crates)
            .map(([name, crate]) => ({ ...crate, name: crate.crateName || name }))
            .filter(item => !crateName || item.name.toLowerCase().includes(crateName))
            .sort((a, b) => a.name.localeCompare(b.name));
        if (list.length > 0) {
            list.unshift({
                content: crateName, // An omnibox result requires non-empty content.
                description: `Following ${list.length} crate(s) were indexed by you, select one to search their docs exclusively.`,
            });
        } else {
            list.unshift({
                content: `https://docs.rs/${crateName}/latest/?search=${encodeURIComponent(keyword)}`,
                description: `Crate <match>${crateName}</match> has not been indexed, search ${keyword ? `<match>${keyword}</match>` : "keyword"} on <dim>${`https://docs.rs/${crateName}`}</dim> directly`,
            });
        }
        return list;
    }

    async searchAll(query) {
        const keyword = query.replaceAll("~", "").trim();
        if (!keyword) return [];

        this.allCrateSearchers ??= this.loadAllCrateSearchers();
        const searchers = await this.allCrateSearchers;
        const results = await Promise.all(searchers.map(searcher => searcher.search(keyword)));
        if (results.length <= 1) return results.flat();

        // Keep the best result from each index near the top of the combined list.
        const name = keyword.split("::").at(-1).toLowerCase();
        return results.flatMap(list => list.map((item, rank) => ({ item, rank })))
            .sort((a, b) => Number(b.item.name.toLowerCase() === name) -
                Number(a.item.name.toLowerCase() === name) || a.rank - b.rank)
            .map(({ item }) => item);
    }

    invalidateCachedSearch() {
        this.cachedCrateSearcher = null;
        this.allCrateSearchers = null;
    }

    static parseCrateDocsSearchKeyword(query) {
        const [crateName, ...keyword] = query.slice(1).trim().split(/\s+/);
        return [crateName, keyword.join(" ")];
    }
}
