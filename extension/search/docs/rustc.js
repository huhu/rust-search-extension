class RustcSearch extends DocSearch {
    constructor(searchIndex, version) {
        super("*", searchIndex);
        this.version = version;
    }

    get rootPath() {
        return "https://doc.rust-lang.org/nightly/nightly-rustc/";
    }
}