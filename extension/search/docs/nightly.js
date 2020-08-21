class NightlySearch extends DocSearch {
    constructor(searchIndex) {
        super("std", searchIndex);
    }

    get rootPath() {
        return "https://doc.rust-lang.org/nightly/";
    }
}

class NightlyDocManager {
    static getNightlyVersion() {
        return localStorage.getItem('nightly-version') || null;
    }

    static setNightlyVersion(version) {
        localStorage.setItem('nightly-version', version);
    }

    static getNightlyDocs() {
        return JSON.parse(localStorage.getItem('nightly-docs') || "{}");
    }

    static setNightlyDocs(docs) {
        localStorage.setItem('nightly-docs', JSON.stringify(docs));
    }
}