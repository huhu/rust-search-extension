// Don't use /g mode, otherwise regex.test() would return an alternating result.
// See https://stackoverflow.com/a/2630538/2220110
const REGEX_DOC_PATH_FILE = /^file:\/\/.*\/doc\/rust\/html\/$/i;
const REGEX_DOC_PATH_HTTP = /^https?:\/\/.*\/$/i;

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
        if (this.checkDocPathValidity(path)) {
            localStorage.setItem('offline-path', path);
        }
    },
    get crateRegistry() {
        return localStorage.getItem("crate-registry") || "crates.io";
    },
    set crateRegistry(value) {
        localStorage.setItem("crate-registry", value);
    },
    // Use regex patterns to check user local doc path validity.
    checkDocPathValidity(path) {
        return REGEX_DOC_PATH_FILE.test(path) || REGEX_DOC_PATH_HTTP.test(path);
    }
};