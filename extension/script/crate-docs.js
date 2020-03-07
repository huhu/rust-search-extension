new Compat().browser.runtime.sendMessage("ennpfpdlaclocpomkiablnmbppdnlhoh", {
        crateName: location.pathname.match(/[0-9a-z_-]+/i)[0],
        searchIndex: window.searchIndex
    },
    (response) => {
        console.log(response);
    }
);