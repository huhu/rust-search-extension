let [_, crateVersion, crateName] = location.pathname.slice(1).split("/");
// A crate version which added to the extension.
let currentCrateVersion = undefined;

document.addEventListener("DOMContentLoaded", async () => {
    let ul = document.querySelector(".landing-search-form-nav>ul");
    let childrenNumber = ul.children.length;
    if (childrenNumber >= 3) {
        await insertFeatureFlagsElement(childrenNumber);
        chrome.runtime.sendMessage({crateName, action: "check"}, crate => {
            if (crate) {
                currentCrateVersion = crate.version;
            }

            insertAddToExtensionElement();
        });
    }
});

async function insertFeatureFlagsElement(number) {
    let sourceLink = document.querySelector(`.landing-search-form-nav>ul>li:nth-child(${number - 1})>a`);

    let response = await fetch(sourceLink.href + "Cargo.toml");
    let features = await parseCargoFeatures(await response.text());
    let html = `<div style="padding: 1rem"><p>This crate has no feature flag.</p></div>`;
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
    sourceLink.parentElement.insertAdjacentHTML("beforebegin",
        `<li class="pure-menu-item pure-menu-has-children pure-menu-allow-hover">
              <a href="#" class="pure-menu-link" aria-label="Feature flags" aria-haspopup="menu">
                <i class="fa fa-fw fa-flag" ></i><span class="title"> Feature flags</span>
              </a>
              <div class="pure-menu-children feature-flags-content" role="menu">
                ${html}
              </div>
          </li>`);
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

    let platformElement = document.querySelector(`.landing-search-form-nav>ul>li:last-child`);
    let li = document.createElement("li");
    li.classList.add("pure-menu-item", "pure-menu-has-children", "pure-menu-allow-hover");
    li.onclick = () => {
        // Toggle search index added state
        if (state === "latest") {
            chrome.runtime.sendMessage({crateName, action: "remove"}, response => {
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
    let iconAttributes = `class="fa fa-fw fa-plus-circle" style="color:#121212"`;
    if (state === "latest") {
        content = `<p>You already added this crate (v${currentCrateVersion}). Click again to remove it.</p>`;
        iconAttributes = `class="fa fa-fw fa-check-circle" style="color:green"`;
    } else if (state === "outdated") {
        content = `<p>You current version v${currentCrateVersion} is outdated. Click to update to the v${crateVersion}.</p>`;
        iconAttributes = `class="fa fa-fw fa-arrow-circle-up" style="color:#e57300"`;
    }
    li.innerHTML = `<div class="add-to-extension"
                         title="Add this crate to Rust Search Extension then you can search it in the address bar."
                         aria-label="Add to Rust Search Extension">
                         <i ${iconAttributes}></i><span class="title"> to Rust Search Extension</span>
                    </div>
                    <div class="pure-menu-children" role="menu">
                        <div class="add-to-extension-content" onclick="event.stopPropagation()">
                            ${content}
                        </div>
                    </div>`;
    platformElement.insertAdjacentElement("afterend", li);
}

window.addEventListener("message", function(event) {
    if (event.source === window &&
        event.data &&
        event.data.direction === "rust-search-extension") {
        chrome.runtime.sendMessage({action: "add", ...event.data.message},
            (response) => {
                console.log(response);
            }
        );
    }
});