// `caniuseIndex` is an array of `feat`: [feat]
// where each `feat` is an ordered array of:
// - Rust version that the feature is stabilized
// - The slug used in caniuse.rs URL
// - (null-able) The flag needed to use the feature in (unstable) Rust
// - A title that describes the feature
// - (null-able) RFC pull request ID

export default class CaniuseSearch {
    constructor(index) {
        this.index = index;
    }

    search(rawKeyword) {
        let keyword = rawKeyword.toLowerCase().replace(/[-_\s#?]/ig, "");
        let result = [];

        this.index.forEach(([version, slug, flag, title, rfc]) => {
            // `match` is for highlighting
            let match = flag || title;
            let searchTerm = match.toLowerCase().replace(/[-_\s#?]/ig, "");

            let matchIndex = searchTerm.toLowerCase().indexOf(keyword);
            if (matchIndex > -1) {
                // skip those without RFC when searching for RFCs
                if (!(rawKeyword.startsWith("??") && rfc == null)) {
                    let description = match === title ? null : title;
                    result.push({
                        matchIndex,
                        version,
                        slug,
                        match,
                        rfc,
                        description,
                    });
                }
            }
        });

        return result.sort((a, b) => {
            if (a.matchIndex === b.matchIndex) {
                return a.match.length - b.match.length;
            }
            return a.matchIndex - b.matchIndex;
        });
    }
};

