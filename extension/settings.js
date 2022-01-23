const settings = {
    get autoUpdate() {
        return JSON.parse(localStorage.getItem('auto-update')) || false;
    },
    set autoUpdate(mode) {
        localStorage.setItem('auto-update', mode);
    },
    get isOfflineMode() {
        return JSON.parse(localStorage.getItem('offline-mode')) || false;
    },
    set isOfflineMode(mode) {
        localStorage.setItem('offline-mode', mode);
    },
    get offlineDocPath() {
        return localStorage.getItem('offline-path');
    },
    set offlineDocPath(path) {
        localStorage.setItem('offline-path', path);
    },
    get crateRegistry() {
        return localStorage.getItem("crate-registry") || "crates.io";
    },
    set crateRegistry(value) {
        localStorage.setItem("crate-registry", value);
    },
    get defaultSearch() {
        return JSON.parse(localStorage.getItem("default-search")) || { thirdPartyDocs: false, docsRs: true, attributes: true };
    },
    set defaultSearch(value) {
        localStorage.setItem("default-search", JSON.stringify(value));
    }
};