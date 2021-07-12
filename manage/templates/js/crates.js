function buildRemoveButton(name) {
    let btn = document.createElement("span");
    btn.classList.add("btn-remove");
    btn.textContent = "Remove";
    btn.onclick = () => {
        CrateDocManager.removeCrate(name);
        btn.parentElement.remove();
    };
    return btn;
}

function buildCrateItem(crate) {
    let li = document.createElement("li");
    li.classList.add("crate-list-item");
    li.style.padding = "15px";
    li.innerHTML = `<div style="display: flex; flex-direction: column;">
        <div>
            <b class="subtitle-text">${crate.name}</b>
            <span class="crate-attr">v${crate.version}</span>
            <a class="crate-attr" href="https://crates.io/crates/${crate.name}" target="_blank">crates.io</a>
            <a class="crate-attr" href="https://docs.rs/${crate.name}" target="_blank">docs.rs</a>
        </div>
        <div class="crate-desc">${crate.doc}</div>
        <div class="crate-extra subtext">
            <b>${crate.searchs}</b> ${crate.searchs > 0 ? "searches" : "search"} since
            <span>${crate.formatedTime}</span>
        </div>
    </div>`;
    li.appendChild(buildRemoveButton(crate.name));
    return li;
}

function refresh(orderBy = "time") {
    let root = document.querySelector(".crate-list");
    // Clear old crate list.
    while (root.firstChild) {
        root.firstChild.remove();
    }

    let compat = new Compat();
    let cratesData = new Statistics().cratesData;
    let crates = Object.entries(CrateDocManager.getCrates()).map(([name, crate]) => {
        return {
            name,
            searchs: cratesData[name] || 0,
            formatedTime: compat.normalizeDate(new Date(crate.time)),
            ...crate,
        };
    });

    if (orderBy === "time") {
        crates.sort((a, b) => b.time - a.time);
    } else if (orderBy === "alphanumeric") {
        crates.sort((a, b) => a.name.localeCompare(b.name));
    } else if (orderBy === "searches") {
        crates.sort((a, b) => b.searchs - a.searchs);
    }

    crates.forEach(crate => {
        root.appendChild(buildCrateItem(crate));
    });

    document.getElementById("crate-count").textContent = crates.length;
}

let crateFilter = document.querySelector("select[name='crate-filter']");
crateFilter.onchange = function() {
    refresh(crateFilter.value);
};

refresh();