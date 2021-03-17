(function () {
    function sendSearchIndex() {
        if (location.hostname === "docs.rs") { // docs.rs pages
            // Parse crate info from location pathname.
            let [_, crateVersion, crateName] = location.pathname.slice(1).split("/");
            window.postMessage({
                direction: "rust-search-extension",
                message: {
                    crateName,
                    crateVersion,
                    searchIndex: window.searchIndex,
                },
            }, "*");
        } else if (location.pathname.startsWith("/nightly/nightly-rustc/")
            && location.hostname === "doc.rust-lang.org") { // rustc pages
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

    if (window.searchIndex) {
        sendSearchIndex();
    } else {
        // Due to the new search-index.js on-demand load mode after PR #82310 has been merged.
        // We need to trigger a manual search-index.js load here.
        console.log("Not search index found, start loading...")
        let rustdocVars = document.getElementById("rustdoc-vars");
        if (rustdocVars) {
            let searchJS = rustdocVars.attributes["data-search-js"].value;
            let script = document.createElement('script');
            script.src = searchJS;
            script.onload = sendSearchIndex;
            document.head.append(script);
        }
    }
})();