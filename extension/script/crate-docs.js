(function() {
    // Parse crate info from location pathname.
    let [_, crateName, crateVersion, ...others] = location.pathname.split("/");

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