(function () {
    let json = null;
    document.getElementById("file-selector").onchange = function () {
        let fileReader = new FileReader();
        fileReader.onload = () => {
            json = JSON.parse(fileReader.result);
            console.log(json);
        };
        fileReader.readAsText(this.files[0]);
    };

    document.querySelector(".btn-import").onclick = (event) => {
        if (!json) return;

        let target = event.target.parentElement;

        if (json["settings"] && target.querySelector(".settings").checked) {
            let importedSettings = json["settings"];
            settings.autoUpdate = importedSettings["auto-update"];
            settings.crateRegistry = importedSettings["crate-registry"];
            settings.isOfflineMode = importedSettings["offline-mode"];
            settings.offlineDocPath = importedSettings["offline-path"];
        }
        if (json["history"] && target.querySelector(".search-history").checked) {
            localStorage.setItem("history", JSON.stringify(json["history"]));
        }
        if (json["stats"] && target.querySelector(".search-statistics").checked) {
            localStorage.setItem("statistics", JSON.stringify(json["stats"]));
        }
        if (json["crates"] && target.querySelector(".crates").checked) {
            let importedCrates = json["crates"];
            let catalog = CrateDocManager.getCrates();
            for (let [name, searchIndex] of Object.entries(importedCrates["list"])) {
                localStorage.setItem(name, JSON.stringify(searchIndex));
            }
            let crates = Object.assign(catalog, importedCrates["catalog"]);
            localStorage.setItem("crates", JSON.stringify(crates));
        }

        alert("Import success!")
    };
})();
