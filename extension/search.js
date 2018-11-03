// This mapping table should match the discriminants of
// `rustdoc::html::item_type::ItemType` type in Rust.
var itemTypes = [
    "mod",
    "externcrate",
    "import",
    "struct",
    "enum",
    "fn",
    "type",
    "static",
    "trait",
    "impl",
    "tymethod",
    "method",
    "structfield",
    "variant",
    "macro",
    "primitive",
    "associatedtype",
    "constant",
    "associatedconstant",
    "union",
    "foreigntype",
    "keyword",
    "existential",
    "attr",
    "derive"
];

// Search words.
var index = [];
var searchIndex = [];
// Max levenshtein distance.
var MAX_LEV_DISTANCE = 2;
/**
 * Global levenshtein_row2 array which used in function levenshtein().
 * @type {Array}
 */
var levenshtein_row2 = [];


function initSearch(rawSearchIndex) {
    index = buildIndex(rawSearchIndex);
}

function buildIndex(rawSearchIndex) {
    searchIndex = [];
    var searchWords = [];
    for (var crate in rawSearchIndex) {
        if (!rawSearchIndex.hasOwnProperty(crate)) {
            continue;
        }

        searchWords.push(crate);
        searchIndex.push({
            crate: crate,
            ty: 1, // == ExternCrate
            name: crate,
            path: "",
            desc: rawSearchIndex[crate].doc,
            type: null,
        });

        // an array of [(Number) item type,
        //              (String) name,
        //              (String) full path or empty string for previous path,
        //              (String) description,
        //              (Number | null) the parent path index to `paths`]
        //              (Object | null) the type of the function (if any)
        var items = rawSearchIndex[crate].items;
        // an array of [(Number) item type,
        //              (String) name]
        var paths = rawSearchIndex[crate].paths;

        // convert `paths` into an object form
        var len = paths.length;
        for (var i = 0; i < len; ++i) {
            paths[i] = {ty: paths[i][0], name: paths[i][1]};
        }

        // convert `items` into an object form, and construct word indices.
        //
        // before any analysis is performed lets gather the search terms to
        // search against apart from the rest of the data.  This is a quick
        // operation that is cached for the life of the page state so that
        // all other search operations have access to this cached data for
        // faster analysis operations
        var len = items.length;
        var lastPath = "";
        for (var i = 0; i < len; ++i) {
            var rawRow = items[i];
            var row = {
                crate: crate, ty: rawRow[0], name: rawRow[1],
                path: rawRow[2] || lastPath, desc: rawRow[3],
                parent: paths[rawRow[4]], type: rawRow[5]
            };
            searchIndex.push(row);
            if (typeof row.name === "string") {
                var word = row.name.toLowerCase();
                searchWords.push(word);
            } else {
                searchWords.push("");
            }
            lastPath = row.path;
        }
    }
    return searchWords;
}

function search(query) {

}

/**
 * A function to compute the Levenshtein distance between two strings
 * Licensed under the Creative Commons Attribution-ShareAlike 3.0 Unported
 * Full License can be found at http://creativecommons.org/licenses/by-sa/3.0/legalcode
 * This code is an unmodified version of the code written by Marco de Wit
 * and was found at http://stackoverflow.com/a/18514751/745719
 */
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

window.initSearch = initSearch;
window.search = search;