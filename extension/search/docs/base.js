import LibrustDocSearch from "./core.js";
import RustdocSearch from "./rustdoc/search.js";
import { isStringdexIndex, restoreRustdocIndex } from "./rustdoc/index.js";

export default class DocSearch {
    constructor(name, searchIndex, rootPath, descShards, filterCrate = null) {
        this.name = name;
        this.rootPath = rootPath;
        this.descShards = descShards;
        this.filterCrate = filterCrate;
        this.setSearchIndex(searchIndex);
    }

    setRootPath(rootPath) {
        this.rootPath = rootPath;
        if (this.legacySearch) this.legacySearch.rootPath = rootPath;
    }

    setSearchIndex(searchIndex) {
        this.legacySearch = null;
        this.database = null;
        if (isStringdexIndex(searchIndex)) {
            this.stringdexIndex = searchIndex;
        } else {
            this.stringdexIndex = null;
            this.legacySearch = new LibrustDocSearch(searchIndex, this.rootPath, this.descShards);
        }
    }

    async getSearchUrl(keyword) {
        let url = `${await this.rootPath}${this.name}/index.html`;
        if (keyword) {
            url += `?search=${encodeURIComponent(keyword)}`;
        }
        return url;
    }

    async search(query) {
        if (!query) return [];
        if (this.legacySearch) {
            const result = await this.legacySearch.execQuery(
                LibrustDocSearch.parseQuery(query), null, this.name);
            return result.others || [];
        }

        this.database ??= restoreRustdocIndex(this.stringdexIndex);
        const rootPath = await this.rootPath;
        const searcher = new RustdocSearch(rootPath, await this.database);
        const { others } = await searcher.execQuery(
            RustdocSearch.parseQuery(query), this.filterCrate, this.name);
        const results = [];
        for await (const item of others) {
            const href = new URL(item.href, rootPath);
            if (!["http:", "https:", "file:"].includes(href.protocol)) continue;
            results.push({
                name: item.item.name,
                displayPath: item.displayPath,
                href: href.href,
                desc: await item.desc,
            });
        }
        return results;
    }
}
