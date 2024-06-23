(async function () {
    async function loadDesc(descShard) {
        if (descShard.promise === null) {
            descShard.promise = new Promise((resolve, reject) => {
                descShard.resolve = resolve;
                const ds = descShard;
                const fname = `${ds.crate}-desc-${ds.shard}-`;
                const url = resourcePath(`search.desc/${descShard.crate}/${fname}`, ".js",);
                loadScript({ url, errorCallback: reject })
            }
            )
        }
        const list = await descShard.promise;
        return list;
    }
    async function loadDescShard(...crates) {
        if (!window.searchState.descShards) return null;

        // Use [[crateName, shards]] array to construct a map.
        let crateDescsShard = [];
        for (let crate of crates) {
            let shards = {};
            for (let descShard of window.searchState.descShards.get(crate) || []) {
                shards[descShard.shard] = await loadDesc(descShard);
            }

            crateDescsShard.push([crate, shards]);
        }

        console.log('load desc shard:', crateDescsShard);
        return crateDescsShard;
    }
    async function sendSearchIndex() {
        // The original searchIndex loaded from search-index.js
        const originalSearchIndex = structuredClone(window.searchIndex);
        loadScript({
            url: getVar("static-root-path") + getVar("search-js"),
            loadCallback: async () => {
                // // After the search.js loaded, init the search
                // window.initSearch(window.searchIndex);

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

                    // [rustdoc] Use Map instead of Object for source files and search index #118910
                    // https://github.com/rust-lang/rust/pull/118910;
                    window.postMessage({
                        direction: "rust-search-extension:docs.rs",
                        message: {
                            libName,
                            crateName,
                            crateVersion,
                            crateTitle: parseCrateTitleFromDOM(),
                            searchIndex: Array.from(originalSearchIndex),
                            descShards: await loadDescShard(libName),
                        },
                    }, "*");
                } else { // stable/nightly pages
                    const STD_CRATES = ['std', 'test', 'proc_macro'];

                    // Remove unnecessary std crate's search index, such as core, alloc, etc
                    let searchIndex = new Map();
                    STD_CRATES.forEach(crate => {
                        searchIndex.set(crate, originalSearchIndex.get(crate));
                    });
                    window.postMessage({
                        direction: `rust-search-extension:std`,
                        message: {
                            searchIndex: Array.from(searchIndex),
                            descShards: await loadDescShard(...STD_CRATES),
                        },
                    }, "*");
                }
                console.log("Send search index success.");
                // Disable librustdoc search.js onpageshow event
                window.onpageshow = function () { };
            }
        });
    }

    // Before rust 1.52.0, we can get the search index from window directly.
    if (window.searchIndex) {
        await sendSearchIndex();
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
            // Load search-index.js first, clone the search index for backup.
            // because after the initSearch() called, the search index will be modified.
            loadScript({ url: searchIndexJs, loadCallback: sendSearchIndex });
        } else {
            console.error("Sorry, no search index found.");
        }
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