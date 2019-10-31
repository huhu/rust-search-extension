const omnibox = new Omnibox();

document.addEventListener('DOMContentLoaded', function() {
    // Open type
    const openTypeSelect = document.querySelector('select[name="open-type"]');
    if (settings.openType) {
        openTypeSelect.value = settings.openType;
        openTypeSelect.selected = true;
    }
    openTypeSelect.onchange = function(event) {
        settings.openType = event.target.value;
    };

    // Offline mode checkbox
    const offlineModeCheckbox = document.querySelector('input[type="checkbox"]');
    const checkedState = settings.isOfflineMode;
    offlineModeCheckbox.checked = checkedState;
    toggleOfflinePathEnableState(checkedState);
    offlineModeCheckbox.onchange = function(event) {
        const checked = event.target.checked;
        settings.isOfflineMode = checked;
        toggleOfflinePathEnableState(checked);
        omnibox.setupDefaultSuggestion();
    };

    // Offline doc path
    const offlineDocPath = document.querySelector('.offline-doc-path');
    offlineDocPath.value = settings.offlineDocPath;
    offlineDocPath.onchange = function(event) {
        let path = event.target.value;
        let message = document.querySelector('.offline-doc-message');
        // Check the std doc path validity
        if (/^file:\/\/.*\/doc\/rust\/html\//ig.test(path)) {
            settings.offlineDocPath = path;

            message.textContent = "Great! Your std doc path is valid!";
            message.style.color = "green";
        } else {
            message.textContent = "Local std doc path should match regex ^file://.*/doc/rust/html/";
            message.style.color = "red";
        }
    };
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
