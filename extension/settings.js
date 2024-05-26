import storage from "./core/storage.js";

// All getters are async getter, all setter are sync setter,
// we just ignore the set promise.
const settings = {
    get autoUpdate() {
        return (async () => {
            return await storage.getItem('auto-update') || false;
        })();
    },
    set autoUpdate(mode) {
        storage.setItem('auto-update', mode);
    },
    get isOfflineMode() {
        return (async () => {
            return await storage.getItem('offline-mode') || false;
        })();
    },
    set isOfflineMode(mode) {
        storage.setItem('offline-mode', mode);
    },
    get offlineDocPath() {
        return (async () => {
            return await storage.getItem('offline-path') || '';
        })();
    },
    set offlineDocPath(path) {
        storage.setItem('offline-path', path);
    },
    get crateRegistry() {
        return (async () => {
            return await storage.getItem("crate-registry") || "crates.io";
        })();
    },
    set crateRegistry(value) {
        storage.setItem("crate-registry", value);
    },
    get defaultSearch() {
        return (async () => {
            return await storage.getItem("default-search") || {
                thirdPartyDocs: false,
                docsRs: true,
                attributes: true
            };
        })();
    },
    set defaultSearch(value) {
        storage.setItem("default-search", value);
    },
    get showMacroRailroad() {
        return (async () => {
            let value = await storage.getItem("show-macro-railroad");
            // Default to true.
            return value === undefined ? true : value;
        })();
    },
    set showMacroRailroad(value) {
        storage.setItem("show-macro-railroad", value);
    },
    get keepCratesUpToDate() {
        return (async () => {
            let value = await storage.getItem("keep-crates-up-to-date");
            // Default to false.
            return value === undefined ? false : value;
        })();
    },
    set keepCratesUpToDate(value) {
        storage.setItem("keep-crates-up-to-date", value);
    },
};

export default settings;