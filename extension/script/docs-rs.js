async function parseCargoFeatures(url) {
    let response = await fetch(url);
    let page = await response.text();
    let start = page.lastIndexOf("[features]");
    let end = page.lastIndexOf("[package]");
    let features = page.slice(start + "[features]".length, end).trim().replace(/&quot;/ig, "\"").split("\n");
    return features.map((item) => item.split("="));
}

document.addEventListener("DOMContentLoaded", async () => {
    let ul = document.querySelector(".landing-search-form-nav>ul");
    if (ul.children.length === 3) {
        let sourceLink = document.querySelector(".landing-search-form-nav>ul>li:nth-child(2)>a");

        let features = await parseCargoFeatures(sourceLink.href + "Cargo.toml");
        let listItems = features.map(([name, flags]) => {
            return `<li class="pure-menu-item">
                        <div>
                            <span class="stab portability">
                                <code>${name}</code>
                            </span>
                            <span>=</span> 
                            <span>${flags}</>
                        </div>
                    </li>`
        }).join("");
        let html = `<li class="pure-menu-item pure-menu-has-children pure-menu-allow-hover">
              <a href="#" class="pure-menu-link" aria-label="Feature flags" aria-haspopup="menu">
                <i class="fa fa-fw fa-flag" ></i><span class="title"> Feature flags</span>
              </a>
              <ul class="pure-menu-children" role="menu">${listItems}</ul>
            </li>`;
        sourceLink.parentElement.insertAdjacentHTML("beforebegin", html);
    }
});