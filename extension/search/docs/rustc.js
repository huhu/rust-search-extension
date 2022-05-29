class RustcSearch extends DocSearch {
    constructor(searchIndex) {
        super("rustc", searchIndex, () => {
            return "https://doc.rust-lang.org/nightly/nightly-rustc/";
        });
    }

    // rustc cached version, see also script/rustc.js
    setVersion(version) {
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