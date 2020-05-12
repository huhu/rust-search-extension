class StdSearch extends DocSearch {
    constructor(searchIndex) {
        super("std", searchIndex);
    }

    get rootPath() {
        return settings.isOfflineMode ? settings.offlineDocPath : "https://doc.rust-lang.org/";
    }
}