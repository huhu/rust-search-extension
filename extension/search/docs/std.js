class StdSearch extends DocSearch {
    constructor(searchIndex) {
        super("std", searchIndex);
    }

    get rootPath() {
        return settings.isOfflineMode ? settings.offlineDocPath : "https://doc.rust-lang.org/";
    }
}

class NightlySearch extends DocSearch {
    constructor(searchIndex) {
        super("std", searchIndex);
    }

    get rootPath() {
        return "https://doc.rust-lang.org/nightly/";
    }
}

class DocManager {
    static getStableDocs() {
        return JSON.parse(localStorage.getItem('stable-docs')) || searchIndex;
    }

    static setStableDocs(docs) {
        localStorage.setItem('stable-docs', JSON.stringify(docs));
    }

    static getNightlyDocs() {
        return JSON.parse(localStorage.getItem('nightly-docs')) || searchIndex;
    }

    static setNightlyDocs(docs) {
        localStorage.setItem('nightly-docs', JSON.stringify(docs));
    }
}