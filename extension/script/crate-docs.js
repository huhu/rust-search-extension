(function() {
    // Parse crate info from location pathname.
    let [_, crateVersion, crateName] = location.pathname.slice(1).split("/");

    chrome.runtime.sendMessage({
            crateName,
            crateVersion,
            searchIndex: window.searchIndex,
        },
        (response) => {
            console.log(response);
        }
    );
})();