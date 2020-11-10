(function() {
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
})();