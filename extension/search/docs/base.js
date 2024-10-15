import LibrustDocSearch from "./core.js";

export default class DocSearch extends LibrustDocSearch {
    // The searchIndex should be Map([[crate, shards],) format
    constructor(name, searchIndex, rootPath, descShards) {
        super(searchIndex, rootPath, descShards);
        this.name = name;
    }

    setRootPath(rootPath) {
        this.rootPath = rootPath;
    }

    setSearchIndex(searchIndex) {
        this.searchIndex = this.buildIndex(searchIndex);
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
        let result = await this.execQuery(LibrustDocSearch.parseQuery(query), null, this.name);
        return result.others || [];
    }
}