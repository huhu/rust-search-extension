const omnibox = new Omnibox();
const CRATES_INDEX_ENDPOINT = "chrome-extension://hlpbdelgppbbhoilofpcfjebkbdgkgma";

async function checkLatestCratesIndex() {
    let response = await fetch(`${CRATES_INDEX_ENDPOINT}/crate-index-version.json`, {
        mode: "no-cors",
    });
    console.log(response);
    let {version} = await response.json();
    if (parseInt(localStorage.getItem("crate-index-version") || 1) < version) {
        await loadLatestCratesIndex(version);

        localStorage.setItem('crate-index', JSON.stringify(window.crateIndex));
        localStorage.setItem('crate-index-version', version);
    }
}

async function loadLatestCratesIndex(version) {
    return new Promise((resolve, reject) => {
        let script = document.createElement('script');
        script.src = `${CRATES_INDEX_ENDPOINT}/crates-index.js?${version}`;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
    });

}

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
    const offlineModeCheckbox = document.getElementById('offline-mode');
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
        if (settings.checkDocPathValidity(path)) {
            settings.offlineDocPath = path;

            message.textContent = "Great! Your local doc path is valid!";
            message.style.color = "green";
        } else {
            message.textContent = "Local doc path should match regex ^file://.*/doc/rust/html/ or ^https?://.*:\\d{2,6}/";
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

(async () => {
    await checkLatestCratesIndex();
})();
