// rawCrateName v.s crateName
// See: https://docs.rs/actix-web/3.2.0/actix_web/
// Here actix-web is the rawCrateName, actix_web is the crateName.
// The rawCrateName mainly for Cargo.toml url to parse feature flags.
let pathname = location.pathname.replace("/crate", "");
let [rawCrateName, crateVersion] = pathname.slice(1).split("/");
crateName = rawCrateName.replaceAll("-", "_");
// A crate version which added to the extension.
let installedVersion = undefined;

document.addEventListener("DOMContentLoaded", async () => {
    let menus = document.querySelector("form>.pure-menu-list:not(.pure-menu-right)");
    if (!menus) return;

    let featureFlagsMenu = Array.from(menus.children).find(menu => menu.textContent.toLowerCase().includes("feature flags"));
    if (featureFlagsMenu) {
        // Rearrange the featureFlagsMenu to order 2th.
        menus.insertBefore(featureFlagsMenu, menus.firstElementChild.nextElementSibling);
        featureFlagsMenu.classList.add("pure-menu-has-children", "pure-menu-allow-hover");
        await enhanceFeatureFlagsMenu(featureFlagsMenu);
    }
});

// Using separate event listener to avoid network requesting latency for feature flags menu enhancement.
document.addEventListener("DOMContentLoaded", async () => {
    let menus = document.querySelector("form>.pure-menu-list:not(.pure-menu-right)");
    if (!menus) return;

    // Exclude /crate/** pages
    if (menus.children.length >= 3 && !location.pathname.includes("/crate/")) {
        chrome.runtime.sendMessage({crateName, action: "crate:check"}, crate => {
            if (crate) {
                insertAddToExtensionElement(getState(crate.version));
            } else {
                insertAddToExtensionElement("need-to-install");
            }
        });
    }
});

async function enhanceFeatureFlagsMenu(menu) {
    // Use rawCrateName to fetch the Cargo.toml, otherwise will get 404.
    let cargoTomUrl = `https://docs.rs/crate/${rawCrateName}/${crateVersion}/source/Cargo.toml`;
    let response = await fetch(cargoTomUrl);
    let features = parseCargoFeatures(await response.text());
    let html = `<div style="padding: 1rem"><p>
                    This crate has no explicit-declared feature flag.
                    <br>
                    Check its <a href="${cargoTomUrl}">Cargo.toml</a> to learn more.
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
                </table>`;
    }
    menu.firstElementChild.insertAdjacentHTML("afterend",
        `
              <div class="pure-menu-children feature-flags-content" role="menu">
                ${html}
              </div>
          `);
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
    if (el) {
        el.remove();
    }

    let menu = document.querySelector(".pure-menu-list:not(.pure-menu-right)");
    let li = document.createElement("li");
    li.classList.add("pure-menu-item", "pure-menu-has-children", "pure-menu-allow-hover");
    li.onclick = () => {
        // Toggle search index added state
        if (state === "latest") {
            chrome.runtime.sendMessage({crateName, action: "crate:remove"}, response => {
                insertAddToExtensionElement(getState(undefined));
            });
        } else {
            injectScripts(["script/add-search-index.js"]);
        }
    };
    let content, iconAttributes, iconFile;
    if (state === "latest") {
        content = `<p>You already added this crate (v${installedVersion}). Click again to remove it.</p>`;
        iconAttributes = `class="fa-svg fa-svg-fw" style="color:green"`;
        iconFile = SVG_CHECK_CIRCLE;
    } else if (state === "outdated") {
        content = `<p>You current version v${installedVersion} is outdated. Click to update to the v${crateVersion}.</p>`;
        iconAttributes = `class="fa-svg fa-svg-fw" style="color:#e57300"`;
        iconFile = SVG_ARROW_UP_CIRCLE;
    } else if (state === "error") {
        // The error case: the user fail to install the crate.
        content = `<p>Oops! Some error happened. You can try again. <br><br>Or check the console and file an issue to report the error.</p>`;
        iconAttributes = `class="fa-svg fa-svg-fw" style="color:#e62f07"`;
        iconFile = SVG_ERROR;
    } else {
        // The default case: need-to-install.
        content = `<p>Add this crate to Rust Search Extension then you can search it in the address bar.</p>`;
        iconAttributes = `class="fa-svg fa-svg-fw" style="color:#121212"`;
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
}

window.addEventListener("message", function (event) {
    if (event.source === window &&
        event.data &&
        event.data.direction === "rust-search-extension") {
        chrome.runtime.sendMessage({action: "crate:add", ...event.data.message},
            (response) => {
                if (response) {
                    insertAddToExtensionElement(getState(event.data.message.crateVersion));
                    console.log("Congrats! This crate has been installed successfully!");
                } else {
                    insertAddToExtensionElement("error");
                    console.error("Oops! We have failed to install this crate!", {
                        pathname,
                        crateVersion,
                        installedVersion,
                        data: event.data,
                    });
                }
            }
        );
    }
});