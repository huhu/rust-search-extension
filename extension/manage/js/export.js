import Statistics from "../../statistics.js";
import Compat from "../../core/compat.js";
import storage from "../../core/storage.js";
import CrateDocManager from "../../crate-manager.js";
import settings from "../../settings.js";

(async function () {
    // ============== export ==============
    document.querySelector(".btn-export").onclick = async (event) => {
        let target = event.target.parentElement;
        let data = Object.create(null)
        if (target.querySelector(".settings").checked) {
            data["settings"] = {
                "auto-update": await settings.autoUpdate,
                "crate-registry": await settings.crateRegistry,
                "offline-mode": await settings.isOfflineMode,
                "offline-path": await settings.offlineDocPath,
            };
        }
        if (target.querySelector(".search-history").checked) {
            data["history"] = await storage.getItem("history") || [];
        }
        if (target.querySelector(".search-statistics").checked) {
            data["stats"] = await Statistics.load();
        }
        if (target.querySelector(".crates").checked) {
            let catalog = await CrateDocManager.getCrates();
            let list = Object.create(null)
            for (const name of Object.keys(catalog)) {
                list[`@${name}`] = await CrateDocManager.getCrateSearchIndex(name);
            }
            data["crates"] = {
                catalog,
                list,
            };
        }
        let date = Compat.normalizeDate(new Date());
        saveToFile(JSON.stringify(data), `rust-search-extension-${date}.json`, 'text/plain');
    };

    function saveToFile(content, fileName, contentType) {
        let a = document.createElement("a");
        let file = new Blob([content], { type: contentType });
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
    }
})();

(function () {
    // ============== import ==============
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
            let catalog = await CrateDocManager.getCrates();
            for (let [name, searchIndex] of Object.entries(importedCrates["list"])) {
                await storage.setItem(name, searchIndex);
            }
            let crates = Object.assign(catalog, importedCrates["catalog"]);
            await storage.setItem("crates", crates);
        }

        alert("Import success!")
    };
})();
