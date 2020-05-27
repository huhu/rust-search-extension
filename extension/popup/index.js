const c = new Compat();
// Get extension background page.
const background = c.getBackgroundPage();
const CRATES_INDEX_BASE_URL = "https://rust-search-extension.now.sh/crates";

const toast = new Toast(".toast");

async function checkLatestCratesIndex() {
    toast.info("Checking latest crates index...");

    let response = await fetch(`${CRATES_INDEX_BASE_URL}/version.json?${Date.now()}`);
    let {version} = await response.json();
    if (background.crateSearcher.getCrateIndexVersion() < version) {
        try {
            toast.info("Updating latest crates index, wait a seconds...");
            await loadLatestCratesIndex(version);

            // Update the latest crates index and mapping.
            background.crateSearcher.setCrateIndex(crateIndex, version);
            background.crateSearcher.updateMapping(mapping);
            toast.success("Updated to latest crates index.");
        } catch (error) {
            toast.error("Update failed, please try again :(");
        }
    } else {
        toast.success("You already the latest crates index.");
    }
    toast.dismiss();
}

async function loadLatestCratesIndex(version) {
    return new Promise((resolve, reject) => {
        let script = document.createElement('script');
        script.src = `${CRATES_INDEX_BASE_URL}/index.js?${version}`;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // Offline mode checkbox
    if (!settings.offlineDocPath) {
        // If the offline doc path not exists, turn off the offline mode.
        settings.isOfflineMode = false;
    }
    const offlineModeCheckbox = document.getElementById('offline-mode');
    const checkedState = settings.isOfflineMode;
    offlineModeCheckbox.checked = checkedState;
    toggleOfflinePathEnableState(checkedState);
    offlineModeCheckbox.onchange = function(event) {
        const checked = event.target.checked;
        settings.isOfflineMode = checked;
        toggleOfflinePathEnableState(checked);
    };

    // Offline doc path
    const offlineDocPath = document.querySelector('.offline-doc-path');
    offlineDocPath.value = settings.offlineDocPath;
    offlineDocPath.onchange = function(event) {
        let path = event.target.value;
        // Check the std doc path validity
        if (settings.checkDocPathValidity(path)) {
            settings.offlineDocPath = path;

            toast.success("Great! Your local doc path is valid!");
        } else {
            // If the offline doc path is invalid, turn off the offline mode.
            offlineModeCheckbox.checked = false;
            toast.error("Local doc path should match regex ^file://.*/doc/rust/html/ or ^https?://.*:\\d{2,6}/");
        }
        toast.dismiss(3000);
    };

    let crateRegistry = document.querySelector("select[name='crate-registry']");
    crateRegistry.value = settings.crateRegistry;
    crateRegistry.onchange = function() {
        settings.crateRegistry = crateRegistry.value;
    };

    let history = JSON.parse(localStorage.getItem("history"));
    let statsPage = document.querySelector(".statistics-page");
    let statsWeekCount = statsPage.querySelector("#stats-week-count");
    if(history) {
        statsWeekCount.textContent = `${history.length}`
    } else {
        statsPage.style.display = "none";
    }
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
    if (c.browserType() !== "firefox") {
        // Only Chrome browser supports 'script-src-elem' Content Security Policy to load script.
        await checkLatestCratesIndex();
    }
})();
