// Some corner cases the crateName different to libName:
// 1. https://docs.rs/actix-web/3.2.0/actix_web/
// 2. https://docs.rs/md-5/0.10.5/md5/
// 
// Here is the rule: https://docs.rs/{crateName}/{crateVersion}/{libName}
let pathname = location.pathname.replace("/crate", "");
let [crateName, crateVersion, libName] = pathname.slice(1).split("/");
// A crate version which added to the extension.
let installedVersion = undefined;

const DOC_HEADERS_SELECTOR = ".top-doc div.docblock>h1[id], .top-doc div.docblock>h2[id], .top-doc div.docblock>h3[id]";

// Highlight the TOC
function highlight() {
    let headers = Array.from(document.querySelectorAll(DOC_HEADERS_SELECTOR))
        .filter(header => ["H1", "H2", "H3"].includes(header.tagName));
    const scrollHandler = entries => {
        entries.forEach(entry => {
            if (entry.intersectionRatio > 0) {
                document.querySelectorAll(".rse-doc-toc-item").forEach((item) => {
                    item.classList.remove("rse-active");
                });

                let url = new URL(entry.target.firstChild.href);
                let link = document.querySelector(`.rse-doc-toc-item a[href$="${url.hash}"]`)
                if (link) {
                    let target = link.parentElement;
                    target.classList.add("rse-active");
                    target.scrollIntoView({ behavior: "auto", block: "nearest" });
                }
            }
        });
    };
    const observer = new IntersectionObserver(scrollHandler);
    headers.forEach(item => observer.observe(item));
}

// Show TOC of docs.rs
document.addEventListener("DOMContentLoaded", () => {
    // Ignore all non-rust doc pages.
    if (!isRustDoc()) return;

    // Don't render TOC if the screen width less than 1500px.
    if (window.innerWidth < 1500) return;

    let headers = Array.from(document.querySelectorAll(DOC_HEADERS_SELECTOR))
        .filter(header => ["H1", "H2", "H3"].includes(header.tagName));
    if (!headers) {
        console.log("No headers parsed for selector:", DOC_HEADERS_SELECTOR);
        return;
    }
    if (headers.length < 3) {
        // Don't show TOC if headers less than 3.
        console.log("The number of headers less than 3, don't show Table of Content.");
        return;
    }

    let mainBlock = document.querySelector("main, #main");
    let ul = document.createElement("ul");
    ul.classList.add("rse-doc-toc");
    for (let header of headers) {
        let [link, text] = header.childNodes;

        let item = document.createElement("li");
        item.innerHTML = `<div class="rse-doc-toc-item rse-doc-toc-${header.tagName.toLowerCase()}">
                <a href="${link.href}">${text.nodeValue}</a>
            </div>`;

        ul.appendChild(item);
    }
    mainBlock.insertAdjacentElement("afterend", ul);
    highlight();
});

document.addEventListener("DOMContentLoaded", async () => {
    let menus = document.querySelector("form>.pure-menu-list:not(.pure-menu-right)");
    if (!menus) return;

    // Since this PR (https://github.com/rust-lang/docs.rs/pull/1527) merged,
    // the latest version path has changed:
    // from https://docs.rs/tokio/1.14.0/tokio/ to https://docs.rs/tokio/latest/tokio/
    //
    // If we parse the crate version from url is 'latest',
    // we should reparse it from the DOM to get the correct value.
    if (crateVersion === 'latest') {
        crateVersion = parseCrateVersionFromDOM();
    }

    // Exclude /crate/** pages
    if (menus.children.length >= 3 && !location.pathname.includes("/crate/")) {
        // Query installed crates from chrome.storage API
        let crates = await storage.getItem("crates") || {};
        let installedCrate = crates[crateName];
        if (!installedCrate && crates[libName]) {
            installedCrate = crates[libName];
        }

        if (installedCrate) {
            insertAddToExtensionElement(getState(installedCrate.version));
        } else {
            insertAddToExtensionElement("need-to-install");
        }
    }


    let featureFlagsMenu = Array.from(menus.children).find(menu => menu.textContent.toLowerCase().includes("feature flags"));
    if (featureFlagsMenu) {
        featureFlagsMenu.classList.add("pure-menu-has-children", "pure-menu-allow-hover");
        await enhanceFeatureFlagsMenu(featureFlagsMenu);
    }

    // Add a menu item to show the crate's security advisories.
    let advisories = await getAdvisories() || [];
    let advisoryMenu = document.createElement("li");
    advisoryMenu.classList.add("pure-menu-item", "pure-menu-has-children", "pure-menu-allow-hover");
    let html = advisories.map(({ advisory, versions }) => {
        let affectedVersions = versions.patched.map(v => `<span class="stab"><code style="white-space: nowrap;">${v}</code></span>`).join(" , ");
        return `<li class="advisory-item">
            <div>
                <img style="width: 15px;vertical-align: middle;margin-right: 5px;" src="https://rustsec.org/img/rustsec-logo-square.svg" alt="advisory">
                <b>${advisory.date}</b>
                <a class="advisory-title" href="https://rustsec.org/advisories/${advisory.id}.html" target="_blank">
                    ${advisoryTitle(advisory)}
                </a>
            </div>
            <div class="advisory-desc">${advisory.title}</div>
            <div class="advisory-affected-versions">
                ${affectedVersions}
            </div>
            </li>`;
    }).join("");

    advisoryMenu.innerHTML = `<a href="https://rustsec.org/${advisories.length > 0 ? `packages/${crateName}.html` : ""}"
                                class="pure-menu-link" target="_blank">
                <span class="fa-svg" aria-hidden="true">${SVG_SHEILD}</span>
                <span class="title">Security ${advisories.length}</span>
                </a>
                <div class="pure-menu-children rse-dropdown-content" role="menu">
                ${advisories.length > 0 ? `<ul>${html}</ul>` : `<div style="padding: 1rem;text-align: center;"><img style="width:100px;padding:1rem"src="https://rustsec.org/img/rustsec-logo-square.svg"/> <div>No security advisories found.</div></div>`}
                </div>`;
    let rseButton = document.querySelector(".add-to-extension");
    if (rseButton?.parentElement) {
        rseButton.parentElement.insertAdjacentElement("beforebegin", advisoryMenu);
    }

    if (getState(installedVersion) === "outdated" && await settings.keepCratesUpToDate) {
        // Auto update outdated crates if the user has enabled the setting.
        injectScripts(["script/lib.js", "script/add-search-index.js"]);
    }
});

// Advisory title. Mirror to code of https://github.com/rustsec/rustsec repository.
function advisoryTitle(advisory) {
    let id = advisory.id;
    let pkg = advisory.package;
    let informational = advisory.informational;
    if (informational) {
        if (informational === "notice") {
            return `${id}: Security notice about ${pkg}`;
        } else if (informational === "unmaintained") {
            return `${id}: ${pkg} is unmaintained`;
        } else if (informational === "unsound") {
            return `${id}: Unsoundness in ${pkg}`;
        } else if (informational === "other") {
            return `${id}: ${pkg} is ${s}`;
        } else {
            return `${id}: Advisory for ${pkg}`;
        }
    } else {
        return `${id}: Vulnerability in ${pkg}`;
    }
}

async function getFeatureFlagsMenuData() {
    // Try to get the data from sessionStorage first.
    let crateData = JSON.parse(sessionStorage.getItem(`${crateName}-${crateVersion}`));
    if (crateData) {
        return crateData;
    }

    let crateAPIURL = `https://crates.io/api/v1/crates/${crateName}/${crateVersion}`;
    let response = await fetch(crateAPIURL);
    let content = await response.json();
    let features = parseCargoFeatures(content);

    let depsURL = `https://crates.io/api/v1/crates/${crateName}/${crateVersion}/dependencies`;
    let depsResponse = await fetch(depsURL);
    let depsContent = await depsResponse.json();
    let optionalDependencies = parseOptionalDependencies(depsContent);

    crateData = { features, optionalDependencies };
    // Cache the data in sessionStorage.
    sessionStorage.setItem(`${crateName}-${crateVersion}`, JSON.stringify(crateData));
    return crateData;
}

async function enhanceFeatureFlagsMenu(menu) {
    let crateData = await getFeatureFlagsMenuData();

    const { features, optionalDependencies } = crateData;
    let html = `<div style="padding: 1rem"><p>
                    This crate has no explicit-declared feature flag.
                    <br>
                    Check its <a style="padding:0" href="https://docs.rs/crate/${crateName}/${crateVersion}/source/Cargo.toml">Cargo.toml</a> to learn more.
                </p></div>`;
    if (features.length > 0) {
        let tbody = features.map(([name, flags]) => {
            return `<tr class="module-item">
                        <td class="docblock-short">
                        <span class="stab portability"><code style="white-space: nowrap;">${name}</code></span>
                        </td>
                        <td>=</td>
                        <td>${flags}</td>
                    </tr>`
        }).join("");
        html = `<table class="feature-flags-table">
                    <tbody>${tbody}</tbody>
                </table>
                `;
    }

    // Render optional dependency list.
    let dependeciesList = optionalDependencies.map(dependency => `
        <li class="optional-dependency-item">
            <a style="padding:0" href="https://docs.rs/${dependency}">
                <span class="stab portability docblock-short">
                    <code style="white-space: nowrap;">${dependency}</code>
                </span>
            </a>
        </li>
    `);
    html += `
        <div class="optional-dependency">
            <p class="optional-dependency-title">Optional dependencies</p>
            ${dependeciesList.length > 0 ? `<ul class="optional-dependency-list">${dependeciesList}</ul>` : `<span>This crate has no optional dependency.</span>`
        }
        </div>`;
    menu.firstElementChild.insertAdjacentHTML("afterend",
        `<div class="pure-menu-children rse-dropdown-content" role="menu">
            ${html}
        </div>`);
}

/**
 * Compare the installed version with the current page's version to get the state.
 * @param version the installed version
 * @returns string outdated|latest|need-to-install
 */
function getState(version) {
    installedVersion = version;
    if (installedVersion) {
        return Semver.compareVersion(installedVersion, crateVersion) === -1 ? "outdated" : "latest";
    } else {
        return "need-to-install";
    }
}

function insertAddToExtensionElement(state) {
    // Remove previous element.
    let el = document.querySelector(".add-to-extension");
    if (el?.parentElement) {
        el.parentElement.remove();
    }

    let menu = document.querySelector(".pure-menu-list:not(.pure-menu-right)");
    let li = document.createElement("li");
    li.classList.add("pure-menu-item", "pure-menu-has-children", "pure-menu-allow-hover");
    li.onclick = async () => {
        // Toggle search index added state
        if (state === "latest") {
            // Use the libName to remove the installed crate.
            await CrateDocManager.removeCrate(libName);
            insertAddToExtensionElement(getState(undefined));
        } else {
            injectScripts(["script/lib.js", "script/add-search-index.js"]);
        }
    };
    let content, iconAttributes, iconFile;
    if (state === "latest") {
        content = `<p>
                      You already added this crate (v${installedVersion}). Click again to remove it.
                      Or click
                      <span id="rse-here" style="text-decoration: underline; cursor: pointer">here</span>
                      to manage all your indexed crates.
                   </p>`;
        iconAttributes = `class="fa-svg" style="color:green"`;
        iconFile = SVG_CHECK_CIRCLE;
    } else if (state === "outdated") {
        content = `<p>You current version v${installedVersion} is outdated. Click to update to the v${crateVersion}.</p>`;
        iconAttributes = `class="fa-svg" style="color:#e57300"`;
        iconFile = SVG_ARROW_UP_CIRCLE;
    } else if (state === "error") {
        // The error case: the user fail to install the crate.
        content = `<p>Oops! Some error happened. You can try again. <br><br>Or check the console and file an issue to report the error.</p>`;
        iconAttributes = `class="fa-svg" style="color:#e62f07"`;
        iconFile = SVG_ERROR;
    } else {
        // The default case: need-to-install.
        content = `<p>Add this crate to Rust Search Extension then you can search it in the address bar.</p>`;
        iconAttributes = `class="fa-svg" style="color:#121212"`;
        iconFile = SVG_PLUS_CIRCLE;
    }
    li.innerHTML = `<div class="add-to-extension"
                         aria-label="Add to Rust Search Extension">
                         <span ${iconAttributes}>${iconFile}</span><span class="title"> to Rust Search Extension</span>
                    </div>
                    <div class="pure-menu-children" role="menu">
                        <div class="add-to-extension-content" onclick="event.stopPropagation()">
                            ${content}
                        </div>
                    </div>`;
    menu.lastElementChild.insertAdjacentElement("afterend", li);

    if (menu.querySelector("#rse-here")) {
        menu.querySelector("#rse-here").onclick = () => {
            let url = chrome.runtime.getURL("manage/crates.html");
            chrome.runtime.sendMessage({ action: "open-url", url });
        };
    }
}

// Get vulnerability advisory for this crate.
async function getAdvisories() {
    // Get advisory from sessionStorage first.
    let key = `advisory:${libName}`;
    let advisory = sessionStorage.getItem(key);
    if (advisory) {
        return JSON.parse(advisory);
    }

    let resp = await fetch(`https://rust.extension.sh/advisory/${libName}.json`);
    if (resp.status === 200) {
        let advisory = await resp.json();
        // Save advisory to sessionStorage.
        sessionStorage.setItem(key, JSON.stringify(advisory));
        return advisory;
    } else {
        sessionStorage.setItem(key, JSON.stringify([]));
        console.log(`${libName} has no vulnerability advisory!`);
        return null;
    }
}

window.addEventListener("message", async function (event) {
    if (event.source === window &&
        event.data &&
        event.data.direction === "rust-search-extension:docs.rs") {
        let message = event.data.message;
        await CrateDocManager.addCrate(message);
        insertAddToExtensionElement(getState(message.crateVersion));
        console.log("Congrats! This crate has been installed successfully!");
    }
});
