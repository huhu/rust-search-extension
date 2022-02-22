(function() {
    function sendSearchIndex() {
        if (location.hostname === "docs.rs") { // docs.rs pages
            // Parse crate info from location pathname.
            let [_, crateVersion, crateName] = location.pathname.slice(1).split("/");
            // Since this PR (https://github.com/rust-lang/docs.rs/pull/1527) merged, 
            // the latest version path has changed:
            // from https://docs.rs/tokio/1.14.0/tokio/ to https://docs.rs/tokio/latest/tokio/
            //
            // If we parse the crate version from url is 'latest',
            // we should reparse it from the DOM to get the correct value.
            if (crateVersion === 'latest') {
                crateVersion = parseCrateVersionFromDOM();
            }
            window.postMessage({
                direction: "rust-search-extension",
                message: {
                    crateName,
                    crateVersion,
                    searchIndex: window.searchIndex,
                },
            }, "*");
        } else if (location.pathname.startsWith("/nightly/nightly-rustc/") &&
            location.hostname === "doc.rust-lang.org") { // rustc pages
            window.postMessage({
                direction: 'rust-search-extension:rustc',
                message: {
                    searchIndex: window.searchIndex,
                },
            }, "*");
        } else { // stable/nightly pages
            const STD_CRATES = ['std', 'test', 'proc_macro'];

            // Remove unnecessary std crate's search index, such as core, alloc, etc
            function cleanSearchIndex() {
                let searchIndex = {};
                STD_CRATES.forEach(crate => {
                    searchIndex[crate] = window.searchIndex[crate];
                });
                return searchIndex;
            }

            window.postMessage({
                direction: `rust-search-extension:std`,
                message: {
                    searchIndex: cleanSearchIndex(window.searchIndex),
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
            let rustdocVars = document.getElementById("rustdoc-vars");
            // If we can't get the search index via "data-search-index-js",
            // then we should fallback to the "data-search-js", which is a
            // temporary stage in librustdoc. 
            // Some crate could depends on this librustdoc. such as https://docs.rs/futures/0.3.14
            searchIndexJs = (rustdocVars.attributes["data-search-index-js"] || rustdocVars.attributes["data-search-js"]).value;
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
})();