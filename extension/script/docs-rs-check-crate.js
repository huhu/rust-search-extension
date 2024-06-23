(function () {
    if (!window.searchState?.descShards) {
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
            svgIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M367.2 412.5L99.5 144.8C77.1 176.1 64 214.5 64 256c0 106 86 192 192 192c41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3C434.9 335.9 448 297.5 448 256c0-106-86-192-192-192c-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z"/></svg>';
        }
        let content = document.querySelector(".add-to-extension-content");
        if (content) {
            content.innerHTML = `<p>This crate version is not supported by Rust Search Extension. <br><br>After Rust Search Extension v2.0 has been released, we only support crate builded after 2024-04-20.</p>`;
        }
        console.log("No searchState.descShards found, cannot add this crate to Rust Search Extension.");
    }
})();