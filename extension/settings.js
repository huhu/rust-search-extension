const settings = {
    get openType() {
        return localStorage.getItem("open-type") || "current-tab";
    },
    set openType(type) {
        localStorage.setItem("open-type", type);
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
        // Use regex match rule to eliminate the tail path
        path = path.replace(/(^file:\/\/.*\/doc\/rust\/html\/)(.*)/ig, "$1");
        localStorage.setItem('offline-path', path);
    },
};