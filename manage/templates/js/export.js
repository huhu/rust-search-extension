(function () {
    document.querySelector(".btn-export").onclick = (event) => {
        let target = event.target.parentElement;
        let data = {};
        if (target.querySelector(".settings").checked) {
            data["settings"] = {
                "auto-update": settings.autoUpdate,
                "crate-registry": settings.crateRegistry,
                "offline-mode": settings.isOfflineMode,
                "offline-path": settings.offlineDocPath,
            };
        }
        if (target.querySelector(".search-history").checked) {
            data["history"] = JSON.parse(localStorage.getItem("history")) || [];
        }
        if (target.querySelector(".search-statistics").checked) {
            data["stats"] = new Statistics();
        }
        if (target.querySelector(".crates").checked) {
            let catalog = CrateDocManager.getCrates();
            let list = {};
            Object.entries(catalog).forEach(([name, _]) => {
                list[`@${name}`] = CrateDocManager.getCrateSearchIndex(name);
            });
            data["crates"] = {
                catalog,
                list,
            };
        }
        let date = new Compat().normalizeDate(new Date());
        saveToFile(JSON.stringify(data), `rust-search-extension-${date}.json`, 'text/plain');
    };

    function saveToFile(content, fileName, contentType) {
        let a = document.createElement("a");
        let file = new Blob([content], {type: contentType});
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
    }
})();