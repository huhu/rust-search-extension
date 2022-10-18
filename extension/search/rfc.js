class RfcSearch {
    constructor(index) {
        this.index = index;
    }

    search(rawKeyword) {
        let keyword = rawKeyword.toLowerCase().replace(/[-_\s#?]/ig, "");
        let result = [];
        this.index.forEach(([number, name, date, title]) => {
            let searchTerm = name.replace(/[-_\s#?]/ig, "");
            if (searchTerm.length < keyword.length) return;

            let matchIndex = searchTerm.indexOf(keyword);
            if (matchIndex > -1) {
                result.push({
                    matchIndex,
                    number, name, date, title
                });
            }
        });

        return result.sort((a, b) => {
            if (a.matchIndex === b.matchIndex) {
                return a.name.length - b.name.length;
            }
            return a.matchIndex - b.matchIndex;
        });
    }
}

