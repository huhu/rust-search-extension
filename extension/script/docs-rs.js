let c = new Compat();

async function parseCargoFeatures(url) {
    let response = await fetch(url);
    let page = await response.text();
    let start = page.lastIndexOf("[features]");
    if (start !== -1) {
        let section = page.slice(start + "[features]".length).split("\n[");
        let features = section[0].trim().replace(/&quot;/ig, "\"").split("\n");
        return features.map((item) => {
            let [name, flags] = item.split("=");
            flags = flags.trim().replace(/"/ig, "");
            return [name, flags];
        });
    } else {
        return [];
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    let ul = document.querySelector(".landing-search-form-nav>ul");
    let childrenNumber = ul.children.length;
    if (childrenNumber >= 3) {
        let crateName = location.pathname.match(/[0-9a-z_-]+/i)[0];
        c.browser.runtime.sendMessage({crateName, check: true}, response => {
            insertAddToExtensionElement(response && response.added);
        });

        await insertFeatureFlagsElement(childrenNumber);
    }
});

async function insertFeatureFlagsElement(number) {
    let sourceLink = document.querySelector(`.landing-search-form-nav>ul>li:nth-child(${number - 1})>a`);

    let features = await parseCargoFeatures(sourceLink.href + "Cargo.toml");
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

function insertAddToExtensionElement(added) {
    let platformElement = document.querySelector(`.landing-search-form-nav>ul>li:last-child`);
    let li = document.createElement("li");
    li.classList.add("pure-menu-item");
    li.onclick = () => {
        injectScripts(["compat.js", "script/crate-docs.js"]);
        // Remove previous element.
        let el = document.querySelector(".add-to-extension");
        if (el) {
            el.remove();
        }
        insertAddToExtensionElement(true);
    };
    let iconAttributes = `class="fa fa-fw fa-plus" style="color:#121212"`;
    if (added) {
        iconAttributes = `class="fa fa-fw fa-check" style="color:green"`;
    }
    li.innerHTML = `<div class="add-to-extension"
                         title="Add this crate's doc to Rust Search Extension, then you can search in the address bar"
                         aria-label="Add to Rust Search Extension">
                         <i ${iconAttributes}></i><span class="title"> to Rust Search Extension</span>
                    </div>`;
    platformElement.insertAdjacentElement("afterend", li);
}

function injectScripts(paths) {
    paths.map(path => {
        let script = document.createElement("script");
        script.src = c.browser.runtime.getURL(path);
        return script;
    }).forEach(script => {
        document.body.insertAdjacentElement('beforeBegin', script);
    });
}