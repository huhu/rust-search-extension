(function () {
    function sendSearchIndex() {
        if (location.hostname === "docs.rs") { // docs.rs pages
            // Parse crate info from location pathname.
            let [crateName, crateVersion, libName] = location.pathname.slice(1).split("/");
            // Since this PR (https://github.com/rust-lang/docs.rs/pull/1527) merged, 
            // the latest version path has changed:
            // from https://docs.rs/tokio/1.14.0/tokio/ to https://docs.rs/tokio/latest/tokio/
            //
            // If we parse the crate version from url is 'latest',
            // we should reparse it from the DOM to get the correct value.
            if (crateVersion === 'latest') {
                crateVersion = parseCrateVersionFromDOM();
            }

            let searchIndex = getSearchIndex();

            // `itemTypes` was reordered in rust-lang/rust@28f17d97a,
            // which first shipped in rustc 1.76.0-nightly (1e9dda77b 2023-11-22),
            // preceded by rustc 1.76.0-nightly (2f8d81f9d 2023-11-21).
            //
            // Mark each index item as using old `itemTypes` if no rustdoc version
            // is available or if the version date is less than 2023-11-22.
            let date = getRustdocVersionDate();
            if (!date || date < "2023-11-22") {
                for (let indexItem of Object.values(searchIndex || {})) {
                    indexItem.oldItemTypes = true;
                }
            }

            window.postMessage({
                direction: "rust-search-extension:docs.rs",
                message: {
                    libName,
                    crateName,
                    crateVersion,
                    searchIndex,
                },
            }, "*");
        } else if (location.pathname.startsWith("/nightly/nightly-rustc/") &&
            location.hostname === "doc.rust-lang.org") { // rustc pages
            window.postMessage({
                direction: 'rust-search-extension:rustc',
                message: {
                    searchIndex: getSearchIndex(),
                },
            }, "*");
        } else { // stable/nightly pages
            const STD_CRATES = ['std', 'test', 'proc_macro'];

            // Remove unnecessary std crate's search index, such as core, alloc, etc
            let rawSearchIndex = getSearchIndex();
            let searchIndex = Object.create(null);
            STD_CRATES.forEach(crate => {
                searchIndex[crate] = rawSearchIndex[crate];
            });
            window.postMessage({
                direction: `rust-search-extension:std`,
                message: {
                    searchIndex,
                },
            }, "*");
        }
        console.log("Send search index success.");
    }

    // Before rust 1.52.0, we can get the search index from window directly.
    if (window.searchIndex) {
        sendSearchIndex();
    } else {
        // Due to the new search-index.js on-demand load mode after PR #82310 has been merged.
        // We need to trigger a manual search-index.js load here.
        console.log("No search index found, start loading...")
        // Since rust 1.58, we can get the searchIndexJs from window.searchIndexJs.
        let searchIndexJs = window.searchIndexJS;

        // For the older version, we still need to get it from the DOM.
        if (!searchIndexJs) {
            // This PR https://github.com/rust-lang/rust/pull/98124 use another way to load search-index:
            // by concatenating the paths to get a full search-index.js file, see resourcePath() function.
            // 
            // Fallback to legacy "data-search-index-js" or "data-search-js", which are a temporary stage 
            // in librustdoc. Some crate could depends on this librustdoc. such as https://docs.rs/futures/0.3.14
            searchIndexJs = resourcePath("search-index", ".js") || getVar('search-index-js') || getVar('search-js');
        }

        if (searchIndexJs) {
            let script = document.createElement('script');
            script.src = searchIndexJs;
            script.onload = sendSearchIndex;
            document.head.append(script);
        } else {
            console.error("Sorry, no search index found.");
        }
    }


    // [rustdoc] Use Map instead of Object for source files and search index #118910
    // https://github.com/rust-lang/rust/pull/118910
    function getSearchIndex() {
        if (window.searchIndex instanceof Map || Object.prototype.toString.call(window.searchIndex) === '[object Map]') {
            return Object.fromEntries(window.searchIndex);
        } else {
            return window.searchIndex;
        }
    }

    function getRustdocVersionDate() {
        return getVar("rustdoc-version")?.match(/\d{4}-\d{2}-\d{2}/)?.[0];
    }

    // ======== Following function mirrored to librustdoc main.js ========

    // Get rustdoc variable from DOM.
    function getVar(name) {
        // https://github.com/rust-lang/rust/pull/113094 has change the way to get meta variable.
        const el = document.querySelector("head > meta[name='rustdoc-vars']") || document.getElementById("rustdoc-vars");
        return el ? el.attributes["data-" + name]?.value : null;
    }

    function resourcePath(basename, extension) {
        let rootPath = getVar("root-path");
        let resrouceSuffix = getVar("resource-suffix")
        if (rootPath && resrouceSuffix) {
            return rootPath + basename + resrouceSuffix + extension;
        } else {
            return null;
        }
    }
})();