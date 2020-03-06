let c = new Compat();
let crateName = location.pathname.match(/[0-9a-z_-]+/i)[0];
c.browser.runtime.sendMessage("ennpfpdlaclocpomkiablnmbppdnlhoh", {crateName, searchIndex: window.searchIndex},
    (response) => {
        console.log(response);
    }
);