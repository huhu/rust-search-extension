(async () => {
    document.addEventListener("DOMContentLoaded", async () => {
        let boxHeader = document.querySelector("div.Box.position-relative>div.Box-header");
        boxHeader.classList.add("rse-sticky-header");
        let height = boxHeader.getBoundingClientRect().height;

        let versions = [];
        // Stick release page h1 title
        for (let title of document.querySelectorAll('.markdown-body>h1')) {
            title.classList.add("rse-sticky-title");
            title.style.top = height + "px";

            let version = parseVersion(title)
            versions.push(version);
        }
        let popover = document.createElement('div');
        popover.classList.add("Popover", "js-hovercard-content", "position-absolute");

        let popoverWrapper = document.createElement("div");
        popoverWrapper.classList.add("Popover-message", "Popover-message--large", "Box", "box-shadow-large", "Popover-message--top-left");

        let ul = document.createElement("ul");
        ul.classList.add("res-version-list");
        let year = new Date().getFullYear();
        versions.filter(version => version.fix === "0" && version.major === "1").forEach(version => {
            let item = document.createElement("li");
            item.classList.add("res-version-list-item");

            let fixVersions = versions
                .filter(v => v.minor === version.minor && v.major === version.major && v.fix !== "0")
                .sort((a, b) => parseInt(a.fix) - parseInt(b.fix));
            if (fixVersions && fixVersions.length > 0) {
                fixVersions = fixVersions.map(fv => `<small><a href="${fv.anchor}">${fv.number}</a></small>`);
            }
            item.innerHTML = `
                    <div style="display: flex">
                        <span><a href="${version.anchor}"><b>${version.number}</b></a></span> 
                        <span class="res-version-date Counter">${version.date}</span>
                    </div>
                    <div style="margin-top: 0.3rem">${fixVersions.join(" , ")}</div>
            `;
            let versionYear = new Date(version.date).getFullYear();
            if (versionYear < year) {
                // Show year gap
                year = versionYear;
                let li = document.createElement("li");
                li.classList.add("res-version-list-gap");
                li.textContent = year;
                ul.appendChild(li);
            }
            ul.appendChild(item);
        });
        popoverWrapper.appendChild(ul);
        popover.appendChild(popoverWrapper);

        let versionListInserted = false;
        let div = document.createElement("div");
        div.textContent = "more";
        div.onmouseover = () => {
            if (!versionListInserted) {
                div.appendChild(popover);
                versionListInserted = true;
            }
        };
        div.onmouseleave = () => {
            popover.remove();
            versionListInserted = false;
        };

        let btnGroup = boxHeader.querySelector(".BtnGroup");
        btnGroup.insertAdjacentElement("beforebegin", div);
    });
})();


function parseVersion(title) {
    let text = title.textContent;
    let anchor = title.firstElementChild.getAttribute("href");
    let [number, date] = text.toLowerCase().replace(/version|\(|\)/ig, "").trim().split(" ");
    let [major, minor, ...fix] = number.split(".");
    fix = fix.join(".");
    return {
        number,
        date,
        major,
        minor,
        fix,
        anchor,
    }
}