import storage from "./core/storage.js";

export default class IndexSetter {
    static setStdStableIndex(index) {
        storage.setItem('index-std-stable', index);
    }

    static setStdNightlyIndex(index) {
        storage.setItem('index-std-nightly', index);
    }

    static setDescShards(crate, shards) {
        if (shards) {
            storage.setItem(`desc-shards-${crate}`, shards);
        }
    }

    static setBookIndex(index) {
        storage.setItem('index-book', index);
    }

    static setLabelIndex(index) {
        storage.setItem('index-label', index);
    }

    static setRfcIndex(index) {
        storage.setItem('index-rfc', index);
    }

    static setCrateMapping(index) {
        storage.setItem('index-crate-mapping', index);
    }

    static setCrateIndex(index) {
        storage.setItem('index-crate', index);
    }

    static setLintIndex(index) {
        storage.setItem('index-lint', index);
    }

    static setCaniuseIndex(index) {
        storage.setItem('index-caniuse', index);
    }

    static setRustcIndex(index) {
        storage.setItem('index-rustc', index);
    }

    static setTargetIndex(index) {
        storage.setItem('index-target', index);
    }

    static setCommandIndex(index) {
        storage.setItem('index-command', index);
    }

    static updateAllIndex() {
        IndexSetter.setBookIndex(booksIndex);
        IndexSetter.setCaniuseIndex(caniuseIndex);
        IndexSetter.setCommandIndex(commandsIndex);
        IndexSetter.setCrateIndex(crateIndex);
        IndexSetter.setCrateMapping(mapping);
        IndexSetter.setLabelIndex(labelsIndex);
        IndexSetter.setLintIndex(lintsIndex);
        IndexSetter.setRfcIndex(rfcsIndex);
        IndexSetter.setRustcIndex(rustcIndex);
        IndexSetter.setStdStableIndex(searchIndex);
        IndexSetter.setTargetIndex(targetsIndex);
    }
};