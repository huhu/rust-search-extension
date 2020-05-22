(function() {
    // Parse crate info from location pathname.
    let [crateName, crateVersion] = location.pathname.slice(1).split("/");
    crateName = crateName.replace("-", "_");
    window.postMessage({
        direction: "rust-search-extension",
        message: {
            crateName,
            crateVersion,
            searchIndex: window.searchIndex,
        },
    }, "*");
})();