// `caniuseIndex` is an array of `feat`: [feat]
// where each `feat` is an ordered array of:
// - Rust version that the feature is stabilized
// - The slug used in caniuse.rs URL
// - (null-able) The flag needed to use the feature in (unstable) Rust
// - A title that describes the feature
// - (null-able) RFC pull request ID

function CaniuseSearch(index) {
    this.feats = {};
    index.forEach(([version, slug, flag, title, rfc]) => {
        // `match` is for highlighting
        let match = flag || title;
        // Other description information
        let description = match === title ? null : title;

        let searchTerm = match.replace(/[-_\s#?]/ig, "");
        this.feats[searchTerm] = {version, slug, match, rfc, description};
    });
    this.searchTerms = Object.keys(this.feats);
}

CaniuseSearch.prototype.search = function (rawKeyword) {
    let keyword = rawKeyword.toLowerCase().replace(/[-_\s#?]/ig, "");
    let result = [];

    for (let searchTerm of this.searchTerms) {
        if (searchTerm.length < keyword.length) continue;

        let foundAt = searchTerm.toLowerCase().indexOf(keyword);
        if (foundAt > -1) {
            let rfc = this.feats[searchTerm].rfc;
            // skip those without RFC when searching for RFCs
            if (!(rawKeyword.startsWith("??") && rfc == null)) {
                result.push({
                    matchIndex: foundAt,
                    ...this.feats[searchTerm],
                });
            }
        }
    }

    return result.sort((a, b) => {
        if (a.matchIndex === b.matchIndex) {
            return a.match.length - b.match.length;
        }
        return a.matchIndex - b.matchIndex;
    });
};
