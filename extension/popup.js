document.addEventListener('DOMContentLoaded', function() {
    var openTypeSelect = document.querySelector('select[name="open-type"]');
    if (localStorage.getItem("open-type")) {
        openTypeSelect.value = localStorage.getItem("open-type");
        openTypeSelect.selected = true;
    }
    openTypeSelect.onchange = onOpenTypeChange;

    var offlineModeCheckbox = document.querySelector('input[type="checkbox"]');
    offlineModeCheckbox.onchange = onOfflineModeChange;
    // JSON parse 'true' or 'false' string to boolean value
    var checkedState = nullOrDefault(JSON.parse(localStorage.getItem('offline-mode')), false);
    offlineModeCheckbox.checked = checkedState;
    toggleOfflinePathEnableState(checkedState);

    var offlineDocPath = document.querySelector('.offline-doc-path');
    offlineDocPath.onchange = onOfflinePathChange;
    offlineDocPath.value = localStorage.getItem('offline-path');
}, false);

function onOpenTypeChange(event) {
    localStorage.setItem("open-type", event.target.value);
}

function onOfflineModeChange(event) {
    var enable = event.target.checked;
    localStorage.setItem('offline-mode', enable);
    toggleOfflinePathEnableState(enable);
}

function toggleOfflinePathEnableState(enable) {
    var offlineDocPath = document.querySelector('.offline-doc-path');
    if (enable) {
        offlineDocPath.classList.remove('disable');
        offlineDocPath.classList.add('enable');
    } else {
        offlineDocPath.classList.remove('enable');
        offlineDocPath.classList.add('disable');
    }
}

function onOfflinePathChange(event) {
    var offlineDocPath = document.querySelector('.offline-doc-path');
    localStorage.setItem("offline-path", offlineDocPath.value);
}

function nullOrDefault(value, default_value) {
    return value === null ? default_value : value;
}