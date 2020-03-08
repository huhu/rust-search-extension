class StdSearch extends DocSearch {
    constructor(searchIndex) {
        let rootPath = settings.offlineDocPath ? settings.offlineDocPath : "https://doc.rust-lang.org/";
        super("std", searchIndex, rootPath);
    }
}