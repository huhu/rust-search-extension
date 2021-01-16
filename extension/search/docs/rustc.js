class RustcSearch extends DocSearch {
    constructor(searchIndex) {
        super("*", searchIndex);
    }

    get rootPath() {
        return "https://doc.rust-lang.org/nightly/nightly-rustc/";
    }
}