const omnibox = new Omnibox();
const CRATES_INDEX_BASE_URL = "https://rust-search-extension.now.sh/crates";

function Toast() {
    this.element = document.querySelector(".toast");
    this.dismissTimeoutId = null;
    this.element.addEventListener("mouseover", () => {
        if (this.dismissTimeoutId) {
            clearTimeout(this.dismissTimeoutId);
        }
    });
    this.element.addEventListener("mouseleave", () => {
        this.dismiss();
    });
}

Toast.prototype.info = function(message) {
    this.element.style.display = "block";
    this.element.style.background = "#fbeca0dd";
    this.element.textContent = message;
};

Toast.prototype.success = function(message) {
    this.element.style.display = "block";
    this.element.style.background = "#357911dd";
    this.element.textContent = message;
};

Toast.prototype.error = function(message) {
    this.element.style.display = "block";
    this.element.style.background = "#ff0000dd";
    this.element.textContent = message;
};

Toast.prototype.dismiss = function(delay = 2000) {
    this.dismissTimeoutId = setTimeout(() => this.element.style.display = "none", delay);
};

const toast = new Toast();

async function checkLatestCratesIndex() {
    toast.info("Checking latest crates index...");

    let response = await fetch(`${CRATES_INDEX_BASE_URL}/version.json?${Date.now()}`);
    let {version} = await response.json();
    if (parseInt(localStorage.getItem("crate-index-version") || 1) < version) {
        try {
            toast.info("Updating latest crates index, wait in seconds...");
            await loadLatestCratesIndex(version);

            localStorage.setItem('crate-index', JSON.stringify(window.crateIndex));
            localStorage.setItem('crate-index-version', version);
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
        script.src = `${CRATES_INDEX_BASE_URL}/crates-index.js?${version}`;
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
        // Check the std doc path validity
        if (settings.checkDocPathValidity(path)) {
            settings.offlineDocPath = path;

            toast.success("Great! Your local doc path is valid!");
        } else {
            toast.error("Local doc path should match regex ^file://.*/doc/rust/html/ or ^https?://.*:\\d{2,6}/");
        }
        toast.dismiss(3000);
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
