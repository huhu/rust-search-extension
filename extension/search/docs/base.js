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
// used for special search precedence
var TY_PRIMITIVE = itemTypes.indexOf("primitive");
var TY_KEYWORD = itemTypes.indexOf("keyword");

// Max levenshtein distance.
var MAX_LEV_DISTANCE = 2;
var MAX_RESULTS = 10;

class DocSearch {

    constructor(searchIndex, rootPath) {
        // The list of search words to query against.
        this.searchWords = [];
        this.searchIndex = this.buildIndex(searchIndex);
        this.rootPath = rootPath;

        // Current query lowercase keyword.
        this.valLower = null;
        this.split = null;
    }

    search(query) {
        if (!query) return [];
        return this.execQuery(this.buildQuery(query));
    }

    buildIndex(rawSearchIndex) {
        let searchIndex = [];
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
            // Compat old style (items, paths) and new style (i, p)
            var items = rawSearchIndex[crate].items || rawSearchIndex[crate].i;
            // an array of [(Number) item type,
            //              (String) name]
            var paths = rawSearchIndex[crate].paths || rawSearchIndex[crate].p;

            // convert `paths` into an object form
            for (var i = 0; i < paths.length; ++i) {
                if (Array.isArray(paths[i])) {
                    paths[i] = {ty: paths[i][0], name: paths[i][1]};
                }
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
        this.searchWords = searchWords;
        return searchIndex;
    }

    buildQuery(raw) {
        var matches, type, query;
        query = raw;

        // let query = "fn:unwrap";
        // then the matches is ["fn:", "fn", index: 0, input: "fn:unwrap", groups: undefined]
        matches = query.match(/^(fn|mod|struct|enum|trait|type|const|macro)\s*:\s*/i);
        if (matches) {
            type = matches[1].replace(/^const$/, 'constant');
            query = query.substring(matches[0].length);
        }

        return {
            raw: raw,
            query: query,
            type: type,
            id: query + type
        };
    }

    execQuery(query) {
        function itemTypeFromName(typename) {
            for (var i = 0; i < itemTypes.length; ++i) {
                if (itemTypes[i] === typename) {
                    return i;
                }
            }
            return -1;
        }

        function checkPath(contains, lastElem, ty) {
            if (contains.length === 0) {
                return 0;
            }
            var ret_lev = MAX_LEV_DISTANCE + 1;
            var path = ty.path.split("::");

            if (ty.parent && ty.parent.name) {
                path.push(ty.parent.name.toLowerCase());
            }

            if (contains.length > path.length) {
                return MAX_LEV_DISTANCE + 1;
            }
            for (var i = 0; i < path.length; ++i) {
                if (i + contains.length > path.length) {
                    break;
                }
                var lev_total = 0;
                var aborted = false;
                for (var x = 0; x < contains.length; ++x) {
                    var lev = levenshtein(path[i + x], contains[x]);
                    if (lev > MAX_LEV_DISTANCE) {
                        aborted = true;
                        break;
                    }
                    lev_total += lev;
                }
                if (aborted === false) {
                    ret_lev = Math.min(ret_lev, Math.round(lev_total / contains.length));
                }
            }
            return ret_lev;
        }

        function typePassesFilter(filter, type) {
            // No filter
            if (filter < 0) return true;

            // Exact match
            if (filter === type) return true;

            // Match related items
            var name = itemTypes[type];
            switch (itemTypes[filter]) {
                case "constant":
                    return (name === "associatedconstant");
                case "fn":
                    return (name === "method" || name === "tymethod");
                case "type":
                    return (name === "primitive" || name === "keyword");
            }

            // No match
            return false;
        }

        function generateId(ty) {
            if (ty.parent && ty.parent.name) {
                return itemTypes[ty.ty] + ty.path + ty.parent.name + ty.name;
            }
            return itemTypes[ty.ty] + ty.path + ty.name;
        }

        this.valLower = query.query.toLowerCase();
        this.split = this.valLower.split("::");

        var val = this.valLower,
            typeFilter = itemTypeFromName(query.type),
            results = {};

        for (var z = 0; z < this.split.length; ++z) {
            if (this.split[z] === "") {
                this.split.splice(z, 1);
                z -= 1;
            }
        }

        var nSearchWords = this.searchWords.length;
        query.inputs = [val];
        query.output = val;
        query.search = val;
        // gather matching search results up to a certain maximum
        // val = val.replace(/\_/g, "");

        // var valGenerics = extractGenerics(val);

        var paths = this.valLower.split("::");
        var j;
        // "std::option::".split("::") => ["std", "option", ""]
        for (j = 0; j < paths.length; ++j) {
            if (paths[j] === "") {
                paths.splice(j, 1);
                j -= 1;
            }
        }
        val = paths[paths.length - 1];
        var contains = paths.slice(0, paths.length > 1 ? paths.length - 1 : 1);

        for (j = 0; j < nSearchWords; ++j) {
            var ty = this.searchIndex[j];
            if (!ty) {
                continue;
            }
            var lev_add = 0;
            if (paths.length > 1) {
                var lev = checkPath(contains, paths[paths.length - 1], ty);
                if (lev > MAX_LEV_DISTANCE) {
                    continue;
                } else if (lev > 0) {
                    lev_add = 1;
                }
            }

            var index = -1;
            // we want lev results to go lower than others
            var lev = MAX_LEV_DISTANCE + 1;
            var fullId = generateId(ty);

            if (this.searchWords[j].indexOf(val) > -1 ||
                this.searchWords[j].replace(/_/g, "").indexOf(val) > -1) {
                // filter type: ... queries
                if (typePassesFilter(typeFilter, ty.ty) && results[fullId] === undefined) {
                    index = this.searchWords[j].replace(/_/g, "").indexOf(val);
                }
            }
            if ((lev = levenshtein(this.searchWords[j], val)) <= MAX_LEV_DISTANCE) {
                if (typePassesFilter(typeFilter, ty.ty) === false) {
                    lev = MAX_LEV_DISTANCE + 1;
                } else {
                    lev += 1;
                }
            }

            lev += lev_add;
            if (lev > 0 && val.length > 3 && this.searchWords[j].indexOf(val) > -1) {
                if (val.length < 6) {
                    lev -= 1;
                } else {
                    lev = 0;
                }
            }

            if (index !== -1 || lev <= MAX_LEV_DISTANCE) {
                if (index !== -1 && paths.length < 2) {
                    lev = 0;
                }
                if (results[fullId] === undefined) {
                    results[fullId] = {
                        id: j,
                        index: index,
                        lev: lev,
                    };
                }
                results[fullId].lev = Math.min(results[fullId].lev, lev);
            }
        }

        return this.sortResults(results);
    }

    sortResults(results) {
        var ar = [];
        for (var entry in results) {
            if (results.hasOwnProperty(entry)) {
                ar.push(results[entry]);
            }
        }
        results = ar;
        var nresults = results.length;
        for (var i = 0; i < nresults; ++i) {
            results[i].word = this.searchWords[results[i].id];
            results[i].item = this.searchIndex[results[i].id] || {};
        }
        // if there are no results then return to default and fail
        if (results.length === 0) {
            return [];
        }

        var valLower = this.valLower;
        results.sort(function(aaa, bbb) {
            var a, b;

            // Sort by non levenshtein results and then levenshtein results by the distance
            // (less changes required to match means higher rankings)
            a = (aaa.lev);
            b = (bbb.lev);
            if (a !== b) {
                return a - b;
            }

            // sort by exact match (mismatch goes later)
            a = (aaa.word !== valLower);
            b = (bbb.word !== valLower);
            if (a !== b) {
                return a - b;
            }

            // sort by item name length (longer goes later)
            a = aaa.word.length;
            b = bbb.word.length;
            if (a !== b) {
                return a - b;
            }

            // sort by item name (lexicographically larger goes later)
            a = aaa.word;
            b = bbb.word;
            if (a !== b) {
                return (a > b ? +1 : -1);
            }

            // sort by index of keyword in item name (no literal occurrence goes later)
            a = (aaa.index < 0);
            b = (bbb.index < 0);
            if (a !== b) {
                return a - b;
            }
            // (later literal occurrence, if any, goes later)
            a = aaa.index;
            b = bbb.index;
            if (a !== b) {
                return a - b;
            }

            // special precedence for primitive and keyword pages
            if ((aaa.item.ty === TY_PRIMITIVE && bbb.item.ty !== TY_KEYWORD) ||
                (aaa.item.ty === TY_KEYWORD && bbb.item.ty !== TY_PRIMITIVE)) {
                return -1;
            }
            if ((bbb.item.ty === TY_PRIMITIVE && aaa.item.ty !== TY_PRIMITIVE) ||
                (bbb.item.ty === TY_KEYWORD && aaa.item.ty !== TY_KEYWORD)) {
                return 1;
            }

            // sort by description (no description goes later)
            a = (aaa.item.desc === '');
            b = (bbb.item.desc === '');
            if (a !== b) {
                return a - b;
            }

            // sort by type (later occurrence in `itemTypes` goes later)
            a = aaa.item.ty;
            b = bbb.item.ty;
            if (a !== b) {
                return a - b;
            }

            // sort by path (lexicographically larger goes later)
            a = aaa.item.path;
            b = bbb.item.path;
            if (a !== b) {
                return (a > b ? +1 : -1);
            }

            // que sera, sera
            return 0;
        });

        for (var i = 0; i < results.length; ++i) {
            var result = results[i];

            // this validation does not make sense when searching by types
            if (result.dontValidate) {
                continue;
            }
            var name = result.item.name.toLowerCase(),
                path = result.item.path.toLowerCase(),
                parent = result.item.parent;

            if (this.validateResult(name, path, this.split, parent) === false) {
                result.id = -1;
            }
        }
        return this.transformResults(results);
    }

    transformResults(results, isType) {
        var out = [];
        for (var i = 0; i < results.length; ++i) {
            if (results[i].id > -1) {
                var obj = this.searchIndex[results[i].id];
                obj.lev = results[i].lev;
                if (isType !== true || obj.type) {
                    var res = this.buildHrefAndPath(obj);
                    // obj.displayPath = pathSplitter(res[0]);
                    obj.displayPath = res[0];
                    obj.fullPath = obj.displayPath + obj.name;
                    // To be sure than it some items aren't considered as duplicate.
                    // obj.fullPath += '|' + obj.ty;
                    obj.href = res[1];
                    out.push(obj);
                    if (out.length >= MAX_RESULTS) {
                        break;
                    }
                }
            }
        }
        return out;
    }

    buildHrefAndPath(item) {
        let rootPath = this.rootPath;
        var displayPath;
        var href;
        var type = itemTypes[item.ty];
        var name = item.name;
        var path = item.path;

        if (type === "mod") {
            displayPath = path + "::";
            href = rootPath + path.replace(/::/g, "/") + "/" +
                name + "/index.html";
        } else if (type === "primitive" || type === "keyword") {
            displayPath = "";
            href = rootPath + path.replace(/::/g, "/") +
                "/" + type + "." + name + ".html";
        } else if (type === "externcrate") {
            displayPath = "";
            href = rootPath + name + "/index.html";
        } else if (item.parent !== undefined) {
            var myparent = item.parent;
            var anchor = "#" + type + "." + name;
            var parentType = itemTypes[myparent.ty];
            var pageType = parentType;
            var pageName = myparent.name;

            if (parentType === "primitive") {
                displayPath = myparent.name + "::";
            } else if (type === "structfield" && parentType === "variant") {
                // Structfields belonging to variants are special: the
                // final path element is the enum name.
                var splitPath = item.path.split("::");
                var enumName = splitPath.pop();
                path = splitPath.join("::");
                displayPath = path + "::" + enumName + "::" + myparent.name + "::";
                anchor = "#variant." + myparent.name + ".field." + name;
                pageType = "enum";
                pageName = enumName;
            } else {
                displayPath = path + "::" + myparent.name + "::";
            }
            href = rootPath + path.replace(/::/g, "/") +
                "/" + pageType +
                "." + pageName +
                ".html" + anchor;
        } else {
            displayPath = item.path + "::";
            href = rootPath + item.path.replace(/::/g, "/") +
                "/" + type + "." + name + ".html";
        }
        return [displayPath, href];    }


    /**
     * Validate performs the following boolean logic. For example:
     * "File::open" will give IF A PARENT EXISTS => ("file" && "open")
     * exists in (name || path || parent) OR => ("file" && "open") exists in
     * (name || path )
     *
     * This could be written functionally, but I wanted to minimise
     * functions on stack.
     *
     * @param  {[string]} name   [The name of the result]
     * @param  {[string]} path   [The path of the result]
     * @param  {[string]} keys   [The keys to be used (["file", "open"])]
     * @param  {[object]} parent [The parent of the result]
     * @return {[boolean]}       [Whether the result is valid or not]
     */
    validateResult(name, path, keys, parent) {
        for (var i = 0; i < keys.length; ++i) {
            // each check is for validation so we negate the conditions and invalidate
            if (!(
                // check for an exact name match
                name.indexOf(keys[i]) > -1 ||
                // then an exact path match
                path.indexOf(keys[i]) > -1 ||
                // next if there is a parent, check for exact parent match
                (parent !== undefined &&
                    parent.name !== undefined &&
                    parent.name.toLowerCase().indexOf(keys[i]) > -1) ||
                // lastly check to see if the name was a levenshtein match
                levenshtein(name, keys[i]) <= MAX_LEV_DISTANCE)) {
                return false;
            }
        }
        return true;
    }
}

/**
 * Global levenshtein_row2 array which used in function levenshtein().
 * @type {Array}
 */
var levenshtein_row2 = [];

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