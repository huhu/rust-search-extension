window.addEventListener("message", async function (event) {
    if (event.source === window &&
        event.data &&
        event.data.direction === "rust-search-extension:update-index") {
        let message = event.data.message;
        console.log('target:', message.target);
        switch (message.target) {
            case 'book': {
                IndexManager.setBookIndex(message.index);
                break;
            }
            case 'caniuse': {
                IndexManager.setCaniuseIndex(message.index);
                break;
            }
            case 'command': {
                IndexManager.setCommandIndex(message.index);
                break;
            }
            case 'crate': {
                IndexManager.setCrateIndex(message.index);
                IndexManager.setCrateMapping(message.mapping);
                break;
            }
            case 'label': {
                IndexManager.setLabelIndex(message.index);
                break;
            }
            case 'lint': {
                IndexManager.setLintIndex(message.index);
                break;
            }
            case 'rfc': {
                IndexManager.setRfcIndex(message.index);
                break;
            }
            case 'rustc': {
                IndexManager.setRustcIndex(message.index);
                break;
            }
            case 'target': {
                IndexManager.setTargetIndex(message.index);
                break;
            }
        }
    }
});