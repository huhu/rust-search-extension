class RustcSearch extends DocSearch {
    constructor(searchIndex, version) {
        super("rustc", searchIndex);
        this.version = version;
    }

    get rootPath() {
        return "https://doc.rust-lang.org/nightly/nightly-rustc/";
    }

    getSearchUrl(keyword) {
        let url = `${this.rootPath}index.html`;
        if (keyword) {
            url += `?search=${encodeURIComponent(keyword)}`;
        }
        return url;
    }
}