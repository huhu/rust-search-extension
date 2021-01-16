(function () {
    window.postMessage({
        direction: 'rust-search-extension:rustc',
        message: {
            searchIndex: window.searchIndex,
        },
    }, "*");
})();