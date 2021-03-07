const toast = new Toast(".toast");

document.addEventListener('DOMContentLoaded', function () {
    const autoUpdateCheckbox = document.getElementById('auto-update');
    autoUpdateCheckbox.checked = settings.autoUpdate;
    autoUpdateCheckbox.onchange = function (event) {
        settings.autoUpdate = event.target.checked;
    };

    // Offline mode checkbox
    if (!settings.offlineDocPath) {
        // If the offline doc path not exists, turn off the offline mode.
        settings.isOfflineMode = false;
    }
    const offlineModeCheckbox = document.getElementById('offline-mode');
    const checkedState = settings.isOfflineMode;
    offlineModeCheckbox.checked = checkedState;
    toggleOfflinePathEnableState(checkedState);
    offlineModeCheckbox.onchange = function (event) {
        const checked = event.target.checked;
        settings.isOfflineMode = checked;
        toggleOfflinePathEnableState(checked);
    };

    // Offline doc path
    const offlineDocPath = document.querySelector('.offline-doc-path');
    offlineDocPath.value = settings.offlineDocPath;
    offlineDocPath.onchange = function (event) {
        let path = event.target.value;
        // Check the std doc path validity
        if (settings.checkDocPathValidity(path)) {
            settings.offlineDocPath = path;

            toast.success("Great! Your local doc path is valid!");
        } else {
            // If the offline doc path is invalid, turn off the offline mode.
            offlineModeCheckbox.checked = false;
            toast.error("Local doc path should match regex ^file://.*/doc/rust/html/$ or ^https?://.*/$");
        }
        toast.dismiss(3000);
    };

    let crateRegistry = document.querySelector("select[name='crate-registry']");
    crateRegistry.value = settings.crateRegistry;
    crateRegistry.onchange = function () {
        settings.crateRegistry = crateRegistry.value;
    };

    let history = JSON.parse(localStorage.getItem("history")) || [];
    let statsPage = document.querySelector(".statistics-page");
    let statsWeekCount = statsPage.querySelector("#stats-week-count");
    let now = new Date();
    let weekAgo = now.setDate(now.getDate() - 7);

    if (history.length > 0) {
        history = history.filter(({time}) => {
            return weekAgo <= time;
        });
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