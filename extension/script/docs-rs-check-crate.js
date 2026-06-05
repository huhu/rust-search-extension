(function () {
    function getVar(name) {
        const el = document.querySelector("head > meta[name='rustdoc-vars']") ||
            document.getElementById("rustdoc-vars");
        return el ? el.attributes["data-" + name]?.value : null;
    }

    const hasOnDemandSearchIndex = !!(
        getVar("root-path") &&
        getVar("resource-suffix") &&
        getVar("stringdex-js")
    );

    if (!window.searchState?.descShards && !hasOnDemandSearchIndex) {
        let button = document.querySelector(".add-to-extension");
        if (button) {
            button.classList.add("add-to-extension-disabled");
            button.onclick = (event) => {
                // Prevent click event propagation to parent element.
                event.stopImmediatePropagation();
            };
        }
        let svgIcon = document.querySelector(".add-to-extension .fa-svg");
        if (svgIcon) {
            svgIcon.style.color = "#666";
            svgIcon.className = "fa fa-solid fa-svg fa-ban";
        }
        let content = document.querySelector(".add-to-extension-content");
        if (content) {
            content.innerHTML = "<p>This crate version is not supported by Rust Search Extension. <br><br>As of Rust Search Extension v2.0, we only support crates built after 2024-04-20.</p>";
        }
        console.log("No searchState.descShards found, cannot add this crate to Rust Search Extension.");
    }
})();
