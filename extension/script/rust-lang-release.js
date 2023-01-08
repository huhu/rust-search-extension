window.onload = () => {
    let searchParams = new URL(location.href).searchParams;
    let toVersion = searchParams.get("version");
    // Parse search parameter to scroll target version
    // E.g: https://github.com/rust-lang/rust/blob/master/RELEASES.md?version=1.43.0 will scroll to version 1.43.0
    if (toVersion) {
        scrollToVersion(toVersion);
    }

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

        let html = `<div style="display: flex">
                        <a href="${version.anchor}"><b>${version.number}</b></a> 
                        <span class="rse-version-date Counter">${version.date}</span>
                    </div>`;
        let fixVersions = versions
            .filter(v => v.minor === version.minor && v.major === version.major && v.fix !== "0")
            .sort((a, b) => parseInt(a.fix) - parseInt(b.fix));
        if (fixVersions?.length > 0) {
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

    let markdownBody = document.querySelector("article.markdown-body");
    let readme = markdownBody.parentElement;
    readme.setAttribute("style", "display: flex; padding-right: 0px !important");
    readme.appendChild(ul);

    setTimeout(() => {
        fixStickyNotWorking();
        fixGithubTocCompatibility();
    });

    highlight();
};

// https://michaelmovsesov.com/articles/fix-css-position-sticky-not-working
function fixStickyNotWorking() {
    let parent = document.querySelector('.rse-version-list').parentElement;

    while (parent) {
        const overflow = getComputedStyle(parent).overflow;
        if (overflow !== 'visible') {
            break;
        }
        parent = parent.parentElement;
    }

    if (parent) {
        parent.setAttribute("style", "position:relative; z-index:0; overflow: visible");
    }
}

// https://web.dev/resize-observer/
function fixGithubTocCompatibility() {
    let tocStickyHeader = document.querySelector("#repos-sticky-header");
    if (tocStickyHeader) {
        let toc = document.querySelector('.rse-version-list');
        const observer = new ResizeObserver(entries => {
            for (let entry of entries) {
                // Hide our TOC if we have no enough space.
                if (entry.contentRect.width <= 1040) {
                    toc.style.display = "none";
                } else {
                    toc.style.display = "block";
                }
            }
        });
        observer.observe(tocStickyHeader);
    }
}

function scrollToVersion(version) {
    let versionElements = Array.from(document.querySelectorAll('.markdown-body>h1'));
    let target = versionElements.find(h1 => h1.textContent.toLowerCase().includes(version.toLowerCase()));
    if (target) {
        location.href = target.firstElementChild.href;
    }
}

function highlight() {
    let items = document.querySelectorAll('.markdown-body>h1>a');
    const scrollHandler = entries => {
        // Find the first entry which intersecting and ratio > 0.9 to highlight.
        let entry = entries.find(entry => {
            return entry.isIntersecting && entry.intersectionRatio > 0.9;
        });
        if (!entry) return;

        document.querySelectorAll(".rse-version-list-item").forEach((item) => {
            item.classList.remove("rse-active");
        });

        let url = new URL(entry.target.href);
        let link = document.querySelector(`.rse-version-list-item a[href$="${url.hash}"]`)
        if (link) {
            let target = link.parentElement.parentElement;
            target.classList.add("rse-active");
            target.scrollIntoView({ behavior: "auto", block: "nearest" });
        }
    };
    const observer = new IntersectionObserver(scrollHandler, { threshold: 1 });
    items.forEach(item => observer.observe(item));
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