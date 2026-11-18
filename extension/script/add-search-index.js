(async function () {
    const direction = "rust-search-extension:rustdoc-index";

    function resourcePath(basename) {
        const rootPath = getRustdocVar("root-path");
        const suffix = getRustdocVar("resource-suffix");
        return rootPath === null || suffix === null ? null : `${rootPath}${basename}${suffix}.js`;
    }

    function loadDesc(shard) {
        if (shard.promise === null) {
            shard.promise = new Promise((resolve, reject) => {
                shard.resolve = resolve;
                const url = resourcePath(`search.desc/${shard.crate}/${shard.crate}-desc-${shard.shard}-`);
                loadRustdocScript(url).catch(reject);
            });
        }
        return shard.promise.catch(error => {
            shard.promise = null;
            shard.resolve = null;
            throw error;
        });
    }

    async function loadDescShards(crates) {
        const descShards = window.searchState?.descShards;
        if (!descShards) return null;

        return Promise.all(crates.map(async crate => {
            const shards = await Promise.all((descShards.get(crate) || []).map(async shard =>
                [shard.shard, await loadDesc(shard)]));
            return [crate, Object.fromEntries(shards)];
        }));
    }

    try {
        const previousIndex = window.searchIndex;
        let original;
        if (!previousIndex || window.initSearch) {
            const url = window.searchIndexJS || resourcePath("search-index") ||
                getRustdocVar("search-index-js") || getRustdocVar("search-js");
            if (url) {
                // Capture the original rows before Rustdoc converts their paths in place.
                const initSearch = window.initSearch;
                window.initSearch = undefined;
                try {
                    await loadRustdocScript(url);
                    original = structuredClone(window.searchIndex);
                } finally {
                    window.initSearch = initSearch;
                    if (previousIndex) window.searchIndex = previousIndex;
                }
            }
        }
        original ??= structuredClone(previousIndex);
        const searchIndex = original instanceof Map ? Array.from(original) : Object.entries(original || {});
        if (searchIndex.length === 0) throw new Error("Empty Rustdoc search index");

        if (!window.initSearch) {
            const searchScript = getRustdocVar("search-js");
            if (searchScript) {
                await loadRustdocScript((getRustdocVar("static-root-path") ?? "") + searchScript);
            }
        } else if (!previousIndex) {
            window.initSearch(window.searchIndex);
        }

        const crates = location.hostname === "docs.rs" ?
            [getRustdocVar("current-crate") || location.pathname.split("/")[3]] :
            ["std", "test", "proc_macro", "core", "alloc"];
        const descShards = await loadDescShards(crates);
        window.postMessage({ direction, message: { searchIndex, descShards } }, location.origin);
    } catch (error) {
        window.postMessage({ direction, error: error.message }, location.origin);
    }
})();
