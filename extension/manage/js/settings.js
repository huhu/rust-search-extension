import settings from "../../settings.js";

// Get the information about the current platform os.
// Possible os values: "mac", "win", "android", "cros", "linux", or "openbsd"
function getPlatformOs() {
    return new Promise(resolve => {
        chrome.runtime.getPlatformInfo(platformInfo => {
            resolve(platformInfo.os);
        });
    });
}

document.addEventListener('DOMContentLoaded', async function () {
    const autoUpdateCheckbox = document.getElementById('auto-update');
    autoUpdateCheckbox.checked = await settings.autoUpdate;
    autoUpdateCheckbox.onchange = async function (event) {
        settings.autoUpdate = event.target.checked;
    };
    const showMacroRailroad = document.getElementById('show-macro-railroad');
    showMacroRailroad.checked = await settings.showMacroRailroad;
    showMacroRailroad.onchange = async function (event) {
        settings.showMacroRailroad = event.target.checked;
    };

    // Offline mode checkbox
    if (!(await settings.offlineDocPath)) {
        // If the offline doc path not exists, turn off the offline mode.
        settings.isOfflineMode = false;
    }
    const offlineModeCheckbox = document.getElementById('offline-mode');
    const checkedState = await settings.isOfflineMode;
    offlineModeCheckbox.checked = checkedState;
    toggleOfflinePathEnableState(checkedState);
    offlineModeCheckbox.onchange = function (event) {
        const checked = event.target.checked;
        settings.isOfflineMode = checked;
        toggleOfflinePathEnableState(checked);
    };

    // Offline doc path
    const offlineDocPath = document.querySelector('.offline-doc-path');
    offlineDocPath.value = await settings.offlineDocPath;
    offlineDocPath.onchange = async function (event) {
        let path = event.target.value;
        if (await getPlatformOs() === "win") {
            // Replace all "/" to "\" for Windows.
            path = event.target.value.replaceAll("/", "\\");
        }
        if (path.startsWith("/")) {
            // Prepend file:// to allow browser open the file url
            path = "file://" + path;
        }

        event.target.value = path;
        settings.offlineDocPath = path;
    };

    let crateRegistry = document.querySelector("select[name='crate-registry']");
    crateRegistry.value = await settings.crateRegistry;
    crateRegistry.onchange = function () {
        settings.crateRegistry = crateRegistry.value;
    };

    const keepCratesUpToDate = document.getElementById("keep-crates-up-to-date");
    keepCratesUpToDate.checked = await settings.keepCratesUpToDate;
    keepCratesUpToDate.onchange = async function (event) {
        settings.keepCratesUpToDate = event.target.checked;
    }

    await setupDefaultSearch();
}, false);


function toggleOfflinePathEnableState(enable) {
    const offlineDocPath = document.querySelector('.offline-doc-path');
    if (enable) {
        offlineDocPath.classList.remove('disable');
        offlineDocPath.classList.add('enable');
    } else {
        offlineDocPath.classList.remove('enable');
        offlineDocPath.classList.add('disable');
    }
}

async function setupDefaultSearch() {
    const thirdPartyDocs = document.getElementById('ds-3rd-docs');
    const docsRs = document.getElementById('ds-docs-rs');
    const attributes = document.getElementById('ds-attributes');

    let defaultSearch = await settings.defaultSearch;

    thirdPartyDocs.checked = defaultSearch.thirdPartyDocs;
    docsRs.checked = defaultSearch.docsRs;
    attributes.checked = defaultSearch.attributes;

    thirdPartyDocs.onchange = function (event) {
        defaultSearch.thirdPartyDocs = event.target.checked;
        settings.defaultSearch = defaultSearch;
    };
    docsRs.onchange = function (event) {
        defaultSearch.docsRs = event.target.checked;
        settings.defaultSearch = defaultSearch;
    };
    attributes.onchange = function (event) {
        defaultSearch.attributes = event.target.checked;
        settings.defaultSearch = defaultSearch;
    };

}