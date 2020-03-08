(function() {
    // Parse crate info from location pathname.
    let [_, crateVersion, crateName] = location.pathname.slice(1).split("/");

    new Compat().browser.runtime.sendMessage("ennpfpdlaclocpomkiablnmbppdnlhoh", {
            crateName,
            crateVersion,
            searchIndex: window.searchIndex,
        },
        (response) => {
            console.log(response);
        }
    );
})();