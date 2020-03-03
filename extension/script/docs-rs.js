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
        let sourceLink = document.querySelector(`.landing-search-form-nav>ul>li:nth-child(${childrenNumber - 1})>a`);

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
            html = `<table style="margin: 0.5rem;border-collapse: separate;border-spacing: 0.5rem;">
                        <tbody>${tbody}</tbody>
                    </table>`;
        }
        sourceLink.parentElement.insertAdjacentHTML("beforebegin",
            `<li class="pure-menu-item pure-menu-has-children pure-menu-allow-hover">
              <a href="#" class="pure-menu-link" aria-label="Feature flags" aria-haspopup="menu">
                <i class="fa fa-fw fa-flag" ></i><span class="title"> Feature flags</span>
              </a>
              <div class="pure-menu-children" role="menu" 
                   style="color:#333;max-height: 600px;overflow: auto;max-width: 60rem;">
                ${html}
              </div>
          </li>`);

    }
});