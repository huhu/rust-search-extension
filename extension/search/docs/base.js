import DocSearchV2 from "./base-v2.js";

export default class DocSearch extends DocSearchV2 {
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
        let result = await this.execQuery(DocSearchV2.parseQuery(query), null, this.name);
        return result.others || [];
    }
}