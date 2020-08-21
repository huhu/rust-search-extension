class NightlySearch extends DocSearch {
    constructor(searchIndex) {
        super("std", searchIndex);
    }

    get rootPath() {
        return "https://doc.rust-lang.org/nightly/";
    }
}

class NightlyDocManager {
    static getNightlyDocs() {
        return JSON.parse(localStorage.getItem('nightly-docs') || "{}");
    }

    static setNightlyDocs(docs) {
        localStorage.setItem('nightly-docs', JSON.stringify(docs));
    }
}