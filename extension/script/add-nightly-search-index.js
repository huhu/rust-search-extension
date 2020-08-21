(function () {
    // Remove needless crate's search index, such as core, alloc, etc
    function cleanSearchIndex() {
        let searchIndex = {};
        searchIndex['std'] = window.searchIndex['std'];
        searchIndex['test'] = window.searchIndex['test'];
        searchIndex['proc_macro'] = window.searchIndex['proc_macro'];
        return searchIndex;
    }

    window.postMessage({
        direction: "rust-search-extension:nightly",
        message: {
            searchIndex: cleanSearchIndex(window.searchIndex),
        },
    }, "*");
})();