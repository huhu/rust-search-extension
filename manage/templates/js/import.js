(function () {
    let json = null;
    let fileSelector = document.querySelector(".file-selector");
    fileSelector.onchange = function () {
        fileSelector.classList.remove("required");

        let fileReader = new FileReader();
        fileReader.onload = () => {
            json = JSON.parse(fileReader.result);
            console.log("Imported JSON:", json);
        };
        fileReader.readAsText(this.files[0]);
    };

    document.querySelector(".btn-import").onclick = async (event) => {
        if (!json) {
            fileSelector.classList.add("required");
            return;
        }

        if (!["settings", "history", "stats", "crates"].some(item => item in json)) {
            alert("Invalid json file");
            return;
        }

        let target = event.target.parentElement;
        if (
            ![".settings", ".search-history", ".search-statistics", ".crates"]
                .some(item => target.querySelector(item).checked)
        ) {
            alert("Please select at least one category to import.");
            return;
        }

        if (json["settings"] && target.querySelector(".settings").checked) {
            let importedSettings = json["settings"];
            settings.autoUpdate = importedSettings["auto-update"];
            settings.crateRegistry = importedSettings["crate-registry"];
            settings.isOfflineMode = importedSettings["offline-mode"];
            settings.offlineDocPath = importedSettings["offline-path"];
        }
        if (json["history"] && target.querySelector(".search-history").checked) {
            await storage.setItem("history", json["history"]);
        }
        if (json["stats"] && target.querySelector(".search-statistics").checked) {
            await storage.setItem("statistics", json["stats"]);
        }
        if (json["crates"] && target.querySelector(".crates").checked) {
            let importedCrates = json["crates"];
            let catalog = CrateDocManager.getCrates();
            for (let [name, searchIndex] of Object.entries(importedCrates["list"])) {
                await storage.setItem(name, searchIndex);
            }
            let crates = Object.assign(catalog, importedCrates["catalog"]);
            await storage.setItem("crates", crates);
        }

        alert("Import success!")
    };
})();
