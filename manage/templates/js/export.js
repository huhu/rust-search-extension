document.querySelector(".btn-export").onclick = (event) => {
    let target = event.target.parentElement;
    let data = {};
    if (target.querySelector(".settings").checked) {
        data["settings"] = {
            "auto-update": JSON.parse(localStorage.getItem("auto-update")),
            "crate-registry": localStorage.getItem("crate-registry"),
            "offline-mode": JSON.parse(localStorage.getItem("offline-mode")),
            "offline-path": localStorage.getItem("offline-path"),
        };
    }
    if (target.querySelector(".search-history").checked) {
        data["history"] = localStorage.getItem("history");
    }
    if (target.querySelector(".search-statistics").checked) {
        data["stats"] = new Statistics();
    }
    if (target.querySelector(".crates").checked) {
        let catalog = CrateDocManager.getCrates();
        let list = Object.entries(catalog).map(([name, _]) => {
            return {[`@${name}`]: CrateDocManager.getCrateSearchIndex(name)};
        });
        data["crates"] = {
            catalog,
            list,
        };
    }

    saveToFile(JSON.stringify(data), 'rust-search-extension.json', 'text/plain');
};

function saveToFile(content, fileName, contentType) {
    let a = document.createElement("a");
    let file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}