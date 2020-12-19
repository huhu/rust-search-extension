(async () => {
    document.addEventListener("DOMContentLoaded", async () => {
        let versions = [];
        for (let title of document.querySelectorAll('.markdown-body>h1')) {
            let version = parseVersion(title)
            versions.push(version);
        }

        let ul = document.createElement("ul");
        ul.classList.add("rse-version-list");
        let year = new Date().getFullYear();
        versions.filter(version => version.fix === "0" && version.major === "1").forEach(version => {
            let item = document.createElement("li");
            item.classList.add("rse-version-list-item");

            let html = `
                    <div style="display: flex">
                        <a href="${version.anchor}"><b>${version.number}</b></a> 
                        <span class="rse-version-date Counter">${version.date}</span>
                    </div>
            `;
            let fixVersions = versions
                .filter(v => v.minor === version.minor && v.major === version.major && v.fix !== "0")
                .sort((a, b) => parseInt(a.fix) - parseInt(b.fix));
            if (fixVersions && fixVersions.length > 0) {
                fixVersions = fixVersions.map(fv => `<a href="${fv.anchor}"><small>${fv.number}</small></a>`).join(" , ");
                html += `<div style="margin-top: 0.3rem">${fixVersions}</div>`;
            }

            item.innerHTML = html;
            let versionYear = new Date(version.date).getFullYear();
            if (versionYear < year) {
                // Show year gap
                year = versionYear;
                let li = document.createElement("li");
                li.classList.add("rse-version-list-gap");
                li.textContent = year;
                ul.appendChild(li);
            }
            ul.appendChild(item);
        });

        let readme = document.querySelector(".readme");
        readme.classList.add("rse-fix-readme");
        readme.appendChild(ul);
    });
    highlight();
})();

function highlightNav(id) {
    document.querySelectorAll(".rse-version-list-item").forEach((item) => {
        item.classList.remove("rse-active");
    });
    let a = document.querySelector(`.rse-version-list-item a[href$="${id}"]`);
    if (a) {
        a.parentElement.parentElement.classList.add("rse-active");
    }
}

function highlight() {
    let elementArr = {};

    let currentHeading = "";
    window.onscroll = () => {
        document.querySelectorAll('.markdown-body>h1>a').forEach(item => {
            if (item.href !== "") {
                let url = new URL(item.href);
                elementArr[url.hash] = item.getBoundingClientRect().top;
            }
        });
        for (let id in elementArr) {
            if (!elementArr.hasOwnProperty(id)) {
                continue;
            }

            if (elementArr[id] > 0 && elementArr[id] < 300) {
                if (currentHeading !== id) {
                    highlightNav(id);
                    currentHeading = id;
                }
                break;
            }
        }
    }
}

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