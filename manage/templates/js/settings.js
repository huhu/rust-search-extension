document.addEventListener('DOMContentLoaded', async function() {
    const autoUpdateCheckbox = document.getElementById('auto-update');
    autoUpdateCheckbox.checked = await settings.autoUpdate;
    autoUpdateCheckbox.onchange = async function(event) {
        settings.autoUpdate = event.target.checked;
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
    offlineModeCheckbox.onchange = function(event) {
        const checked = event.target.checked;
        settings.isOfflineMode = checked;
        toggleOfflinePathEnableState(checked);
    };

    // Offline doc path
    const offlineDocPath = document.querySelector('.offline-doc-path');
    offlineDocPath.value = await settings.offlineDocPath;
    offlineDocPath.onchange = function(event) {
        settings.offlineDocPath = event.target.value;
    };

    let crateRegistry = document.querySelector("select[name='crate-registry']");
    crateRegistry.value = await settings.crateRegistry;
    crateRegistry.onchange = function() {
        settings.crateRegistry = crateRegistry.value;
    };

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

    thirdPartyDocs.onchange = function(event) {
        defaultSearch.thirdPartyDocs = event.target.checked;
        settings.defaultSearch = defaultSearch;
    };
    docsRs.onchange = function(event) {
        defaultSearch.docsRs = event.target.checked;
        settings.defaultSearch = defaultSearch;
    };
    attributes.onchange = function(event) {
        defaultSearch.attributes = event.target.checked;
        settings.defaultSearch = defaultSearch;
    };

}