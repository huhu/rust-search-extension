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
        let link = header.firstChild;

        let item = document.createElement("li");
        item.innerHTML = `<div class="rse-doc-toc-item rse-doc-toc-${header.tagName.toLowerCase()}">
                <a href="${link.href}">${link.textContent}</a>
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
});

async function getFeatureFlagsMenuData() {
    let crateAPIURL = `https://crates.io/api/v1/crates/${crateName}/${crateVersion}`;
    let response = await fetch(crateAPIURL);
    let content = await response.json();
    let features = parseCargoFeatures(content);

    let depsURL = `https://crates.io/api/v1/crates/${crateName}/${crateVersion}/dependencies`;
    let depsResponse = await fetch(depsURL);
    let depsContent = await depsResponse.json();
    let optionalDependencies = parseOptionalDependencies(depsContent);

    return { features, optionalDependencies };
}

async function enhanceFeatureFlagsMenu(menu) {
    let crateData = JSON.parse(window.sessionStorage.getItem(`${crateName}-${crateVersion}`));

    if (!crateData) {
        crateData = await getFeatureFlagsMenuData();
        window.sessionStorage.setItem(`${crateName}-${crateVersion}`, JSON.stringify(crateData));
    }

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
        `<div class="pure-menu-children feature-flags-content" role="menu">
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
