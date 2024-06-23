import DocSearchV2 from "./base-v2.js";

export default class DocSearch extends DocSearchV2 {
    constructor(name, searchIndex, rootPath) {
        if (!(searchIndex instanceof Map)) {
            searchIndex = new Map(Object.entries(searchIndex));
        }
        super(searchIndex, rootPath);
        this.name = name;
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
        return await this.execQuery(DocSearchV2.parseQuery(query), null, this.name);
    }
}