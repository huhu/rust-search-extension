import RustdocSearchSandboxClient from "./rustdoc-search-client.js";

export default class OnDemandCrateDocSearch {
    constructor(crate) {
        this.updateMetadata(crate);
    }

    updateMetadata(crate) {
        this.libName = crate.libName;
        this.crateName = crate.crateName || crate.libName;
        this.name = this.crateName;
        this.version = crate.version;
        this.rootPath = crate.rootPath;
        this.stringdexUrl = crate.stringdexUrl;
        this.rootIndexUrl = crate.rootIndexUrl;
        this.searchIndexBaseUrl = crate.searchIndexBaseUrl;
    }

    static isSupported(crate) {
        return !!(
            crate?.rootPath &&
            crate?.stringdexUrl &&
            crate?.rootIndexUrl &&
            crate?.searchIndexBaseUrl
        );
    }

    setRootPath(rootPath) {
        this.rootPath = rootPath;
    }

    async getSearchUrl(keyword) {
        let url = `${this.rootPath}${this.libName}/index.html`;
        if (keyword) {
            url += `?search=${encodeURIComponent(keyword)}`;
        }
        return url;
    }

    async search(query) {
        if (!query) return [];

        try {
            return await RustdocSearchSandboxClient.search(this.getSearchContext(), query);
        } catch (error) {
            if (RustdocSearchSandboxClient.isSupersededRequestError(error)) {
                return [];
            }
            throw error;
        }
    }

    getSearchContext() {
        return {
            libName: this.libName,
            crateName: this.crateName,
            rootPath: this.rootPath,
            stringdexUrl: this.stringdexUrl,
            rootIndexUrl: this.rootIndexUrl,
            searchIndexBaseUrl: this.searchIndexBaseUrl,
        };
    }
}
