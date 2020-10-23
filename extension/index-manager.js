class IndexManager {
    static getStdStableIndex() {
        return JSON.parse(localStorage.getItem('index-std-stable')) || searchIndex;
    }

    static setStdStableIndex(index) {
        localStorage.setItem('index-std-stable', JSON.stringify(index));
    }

    static getStdNightlyIndex() {
        return JSON.parse(localStorage.getItem('index-std-nightly')) || searchIndex;
    }

    static setStdNightlyIndex(docs) {
        localStorage.setItem('index-std-nightly', JSON.stringify(docs));
    }

    static getBookIndex() {
        return JSON.parse(localStorage.getItem('index-book')) || booksIndex;
    }

    static setBookIndex(index) {
        localStorage.setItem('index-book', JSON.stringify(index));
    }

    static getLabelIndex() {
        return JSON.parse(localStorage.getItem('index-label')) || labelsIndex;
    }

    static setLabelIndex(index) {
        localStorage.setItem('index-label', JSON.stringify(index));
    }

    static getCrateMapping() {
        return JSON.parse(localStorage.getItem('index-crate-mapping')) || mapping;
    }

    static setCrateMapping(mapping) {
        localStorage.setItem('index-crate-mapping', JSON.stringify(mapping));
    }

    static getCrateIndex() {
        return JSON.parse(localStorage.getItem('index-crate')) || crateIndex;
    }

    static setCrateIndex(index) {
        localStorage.setItem('index-crate', JSON.stringify(index));
    }

    static getLintIndex() {
        return JSON.parse(localStorage.getItem('index-lint')) || lintsIndex;
    }

    static setLintIndex(index) {
        localStorage.setItem('index-lint', JSON.stringify(index));
    }

    static getCaniuseIndex() {
        return JSON.parse(localStorage.getItem('index-caniuse')) || caniuseIndex;
    }

    static setCaniuseIndex(index) {
        localStorage.setItem('index-caniuse', JSON.stringify(index));
    }

    static getCommandIndex() {
        return JSON.parse(localStorage.getItem('index-command')) || commandsIndex;
    }

    static setCommandIndex(index) {
        localStorage.setItem('index-command', JSON.stringify(index));
    }
}