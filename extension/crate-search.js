var levenshtein_row2 = [];

function levenshtein(s1, s2) {
    if (s1 === s2) {
        return 0;
    }
    var s1_len = s1.length, s2_len = s2.length;
    if (s1_len && s2_len) {
        var i1 = 0, i2 = 0, a, b, c, c2, row = levenshtein_row2;
        while (i1 < s1_len) {
            row[i1] = ++i1;
        }
        while (i2 < s2_len) {
            c2 = s2.charCodeAt(i2);
            a = i2;
            ++i2;
            b = i2;
            for (i1 = 0; i1 < s1_len; ++i1) {
                c = a + (s1.charCodeAt(i1) !== c2 ? 1 : 0);
                a = row[i1];
                b = b < a ? (b < c ? b + 1 : c) : (a < c ? a + 1 : c);
                row[i1] = b;
            }
        }
        return b;
    }
    return s1_len + s2_len;
}

// Prototype function to perform levenshtein contain search.
String.prototype.levenshteinContains = function(keyword) {
    let len = keyword.length;
    if (this === keyword) return true;

    for (let i = 0; i <= this.length - len; i++) {
        if (levenshtein(this.substring(i, len), keyword) <= 1) {
            return true;
        }
    }
    return false;
};

function cleanMinifiedUrl(rawUrl) {
    if (rawUrl === null) return null;
    return "https://" + rawUrl
        .replace("D/", "docs.rs/")
        .replace("C/", "crates.io/")
        .replace("O/", "github.io/")
        .replace("G/", "github.com/")
        .replace("/I", "/index.html");
}

// Clean the raw crate index.
function cleanCrateIndex(rawCrateIndex) {
    let crateIndex = {};
    for (let [crateId, [description, documentation, version]] of Object.entries(rawCrateIndex)) {
        crateIndex[crateId] = {
            id: crateId,
            description: description,
            documentation: cleanMinifiedUrl(documentation),
            version: version,
        }
    }
    return crateIndex;
}

function CrateSearch(crateIndex) {
    this.crateIndex = cleanCrateIndex(crateIndex);
    this.crateIds = Object.keys(crateIndex).sort();
}

/**
 * Perform prefix levenshtein search.
 * @param keyword the keyword to search against.
 * @param limit the max result length, default is 5.
 * @returns
 */
CrateSearch.prototype.search = function(keyword, limit = 5) {
    keyword = keyword.replace(/[-_]/ig, "");
    let result = [];
    for (let rawCrateId of this.crateIds) {
        let crateId = rawCrateId.replace(/[-_]/ig, "");
        if (crateId.length < keyword.length) continue;

        let index = crateId.indexOf(keyword);
        if (index !== -1) {
            result.push({
                id: rawCrateId,
                matchIndex: index,
            });
        } else if (keyword.length >= 3 && crateId.levenshteinContains(keyword)) {
            result.push({
                id: rawCrateId,
                matchIndex: 999, // Levenshtein contain result always has lowest matchIndex.
            });
        }
    }
    // Sort the result, the lower matchIndex and length, the higher rank.
    return result.sort((a, b) => {
        if (a.matchIndex === b.matchIndex) {
            return a.id.length - b.id.length;
        }
        return a.matchIndex - b.matchIndex;
    })
        .slice(0, limit)
        .map(item => {
            return this.crateIndex[item.id];
        });
};