let cratesData = new Statistics().cratesData;

function buildRemoveButton(name) {
    let btn = document.createElement("span");
    btn.textContent = "Remove";
    btn.onclick = () => {
        CrateDocManager.removeCrate(name);
        btn.parentElement.remove();
    };
    return btn;
}

function buildCrateItem(crate) {
    let li = document.createElement("li");
    li.classList.add("text");
    li.style.padding = "10px";
    li.innerHTML = `
        <div>
            <b class="subtitle-text">${crate.name}</b>
            <span class="text">${crate.version}</span>
            <a href="https://crates.io/crates/${crate.name}" target="_blank">crates.io</a>
            <a href="https://docs.rs/${crate.name}" target="_blank">docs.rs</a>
        </div>
        <div>
            <span>${crate.doc}</span>
            <span>${crate.time}</span>
            <span>${cratesData[crate.name] || 0}</span>
        </div>
    `;
    li.appendChild(buildRemoveButton(crate.name));
    return li;
}

function refresh() {
    let crates = Object.entries(CrateDocManager.getCrates());
    let root = document.querySelector(".crate-list");
    for (let [name, crate] of crates) {
        root.appendChild(buildCrateItem({
            name,
            ...crate
        }));
    }

    document.getElementById("crate-count").textContent = crates.length;
}

refresh();