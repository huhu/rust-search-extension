// rawCrateName v.s crateName
// See: https://docs.rs/actix-web/3.2.0/actix_web/
// Here actix-web is the rawCrateName, actix_web is the crateName.
// The rawCrateName mainly for Cargo.toml url to parse feature flags.
let pathname = location.pathname.replace("/crate", "");
let [rawCrateName, crateVersion] = pathname.slice(1).split("/");
crateName = rawCrateName.replaceAll("-", "_");
// A crate version which added to the extension.
let currentCrateVersion = undefined;

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
                currentCrateVersion = crate.version;
            }
            insertAddToExtensionElement();
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

function insertAddToExtensionElement() {
    let state;
    if (currentCrateVersion) {
        state = Semver.compareVersion(currentCrateVersion, crateVersion) === -1 ? "outdated" : "latest";
    }

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
                currentCrateVersion = undefined;
                insertAddToExtensionElement();
            });
        } else {
            currentCrateVersion = crateVersion;
            injectScripts(["script/add-search-index.js"]);
            insertAddToExtensionElement();
        }
    };
    let content = `<p>Add this crate to Rust Search Extension then you can search it in the address bar.</p>`;
    let iconAttributes = `class="fa-svg fa-svg-fw" style="color:#121212"`;
    let iconFile = SVG_PLUS_CIRCLE;
    if (state === "latest") {
        content = `<p>You already added this crate (v${currentCrateVersion}). Click again to remove it.</p>`;
        iconAttributes = `class="fa-svg fa-svg-fw" style="color:green"`;
        iconFile = SVG_CHECK_CIRCLE;
    } else if (state === "outdated") {
        content = `<p>You current version v${currentCrateVersion} is outdated. Click to update to the v${crateVersion}.</p>`;
        iconAttributes = `class="fa-svg fa-svg-fw" style="color:#e57300"`;
        iconFile = SVG_ARROW_UP_CIRCLE;
    }
    li.innerHTML = `<div class="add-to-extension"
                         title="Add this crate to Rust Search Extension then you can search it in the address bar."
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
                console.log(response);
            }
        );
    }
});