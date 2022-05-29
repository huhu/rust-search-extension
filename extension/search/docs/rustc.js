class RustcSearch extends DocSearch {
    constructor(searchIndex, version) {
        super("rustc", searchIndex, () => {
            return "https://doc.rust-lang.org/nightly/nightly-rustc/";
        });
        this.version = version;
    }

    getSearchUrl(keyword) {
        let url = `${this.getRootPath()}index.html`;
        if (keyword) {
            url += `?search=${encodeURIComponent(keyword)}`;
        }
        return url;
    }
}