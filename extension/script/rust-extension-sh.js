window.addEventListener("message", async function (event) {
    if (event.source === window &&
        event.data &&
        event.data.direction === "rust-search-extension:update-index") {
        let message = event.data.message;
        console.log('target:', message.target);
        switch (message.target) {
            case 'book': {
                rse.IndexSetter.setBookIndex(message.index);
                break;
            }
            case 'caniuse': {
                rse.IndexSetter.setCaniuseIndex(message.index);
                break;
            }
            case 'command': {
                rse.IndexSetter.setCommandIndex(message.index);
                break;
            }
            case 'crate': {
                rse.IndexSetter.setCrateIndex(message.index);
                rse.IndexSetter.setCrateMapping(message.mapping);
                break;
            }
            case 'label': {
                rse.IndexSetter.setLabelIndex(message.index);
                break;
            }
            case 'lint': {
                rse.IndexSetter.setLintIndex(message.index);
                break;
            }
            case 'rfc': {
                rse.IndexSetter.setRfcIndex(message.index);
                break;
            }
            case 'rustc': {
                rse.IndexSetter.setRustcIndex(message.index);
                break;
            }
            case 'target': {
                rse.IndexSetter.setTargetIndex(message.index);
                break;
            }
        }
    }
});