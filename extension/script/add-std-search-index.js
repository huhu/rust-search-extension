(function () {
    const STD_CRATES = ['std', 'test', 'proc_macro'];

    // Remove unnecessary std crate's search index, such as core, alloc, etc
    function cleanSearchIndex() {
        let searchIndex = {};
        STD_CRATES.forEach(crate => {
            searchIndex[crate] = window.searchIndex[crate];
        });
        return searchIndex;
    }

    if (window.searchIndex && STD_CRATES.every(crate => crate in window.searchIndex)) {
        window.postMessage({
            direction: `rust-search-extension:std`,
            message: {
                searchIndex: cleanSearchIndex(window.searchIndex),
            },
        }, "*");
    }
})();