import Statistics from "../../statistics.js";
import Compat from "../../core/compat.js";
import CrateDocManager from "../../crate-manager.js";

function buildRemoveButton(name) {
    let btn = document.createElement("span");
    btn.classList.add("btn-remove");
    btn.textContent = "Remove";
    btn.onclick = async () => {
        await CrateDocManager.removeCrate(name);
        // Update the crate count
        let crates = await CrateDocManager.getCrates();
        document.getElementById("crate-count").textContent = Object.keys(crates).length || '0';
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
            <b class="subtitle-text">${crate.crateName || crate.name}</b>
            <span class="crate-attr">v${crate.version}</span>
            <a class="crate-attr" href="https://crates.io/crates/${crate.crateName || crate.name}" target="_blank">crates.io</a>
            <a class="crate-attr" href="https://docs.rs/${crate.crateName || crate.name}" target="_blank">docs.rs</a>
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

async function refresh(orderBy = "time") {
    let root = document.querySelector(".crate-list");
    // Clear old crate list.
    while (root.firstChild) {
        root.firstChild.remove();
    }

    const { timeline } = await Statistics.load();
    const cratesData = timeline.reduce((pre, [time, type, crate]) => {
        if (crate) {
            pre[crate] = (pre[crate] || 0) + 1;
        }
        return pre;
    }, Object.create(null));
    let crates = Object.entries(await CrateDocManager.getCrates()).map(([name, crate]) => {
        return {
            name,
            searchs: cratesData[name] || 0,
            formatedTime: Compat.normalizeDate(new Date(crate.time)),
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
crateFilter.onchange = async function () {
    await refresh(crateFilter.value);
};

(async () => {
    await refresh();
})();