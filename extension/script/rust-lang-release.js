document.addEventListener("DOMContentLoaded", async () => {
    let versions = [];
    // Stick release page h1 title
    let titles = document.querySelectorAll('.markdown-body>h1');
    for (let title of titles) {
        versions.push(parseVersion(title));
        title.classList.add("rse-sticky")
        let s = document.createElement('span');
        s.innerHTML = `<a href="https://blog.rust-lang.org/" class="rse-button">Release blog</a>`;
        title.appendChild(s);
    }

    let ul = document.createElement("ul");
    let year = new Date().getFullYear();
    versions.filter(version => version.fix === "0" && version.major === "1").forEach(version => {
        let item = document.createElement("li");

        let fixVersions = versions
            .filter(v => v.minor === version.minor && v.major === version.major && v.fix !== "0")
            .sort((a, b) => parseInt(a.fix) - parseInt(b.fix));
        if (fixVersions && fixVersions.length > 0) {
            fixVersions = fixVersions.map(fv => `<span><a href="${fv.anchor}">${fv.version}</a></span>`);
        }
        item.innerHTML = `<div>
                <span><a href="${version.anchor}">${version.version}</a></span>
                ${fixVersions.join(" ")}
            </div>`;
        let versionYear = new Date(version.date).getFullYear();
        if (versionYear < year) {
            // Show year gap
            year = versionYear;
            let li = document.createElement("li");
            li.textContent = year;
            ul.appendChild(li);
        }
        ul.appendChild(item);
    });

    let div = document.createElement("div");
    div.classList.add("rse-more");
    div.textContent = "more";
    div.onmouseover = () => {
        div.appendChild(ul);
    };
    div.onmouseleave = () => {
        ul.remove();
    };
    titles[0].appendChild(div);
});

function parseVersion(title) {
    let text = title.textContent;
    let anchor = title.firstElementChild.getAttribute("href");
    let [version, date] = text.toLowerCase().replace(/version|\(|\)/ig, "").trim().split(" ");
    let [major, minor, ...fix] = version.split(".");
    fix = fix.join(".");
    return {
        version,
        date,
        major,
        minor,
        fix,
        anchor,
    }
}