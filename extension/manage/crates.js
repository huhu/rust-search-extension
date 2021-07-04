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
    li.innerHTML = `
        <div>
            ${crate.name}
            <span>${crate.version}</span>
            <a href="https://crates.io/crates/${crate.name}" target="_blank">crates.io</a>
            <a href="https://docs.rs/${crate.name}" target="_blank">docs.rs</a>
        </div>
        <div>
        <span>${crate.doc}</span>
        <span>${crate.time}</span>
        </div>
    `;
    li.appendChild(buildRemoveButton(crate.name));
    return li;
}

function refresh() {
    let crates = CrateDocManager.getCrates();
    let root = document.querySelector(".crate-list");
    for (let [name, crate] of Object.entries(crates)) {
        root.appendChild(buildCrateItem({
            name,
            ...crate
        }));
    }
}

refresh();