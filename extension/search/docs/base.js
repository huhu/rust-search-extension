// This mapping table should match the discriminants of
// `rustdoc::html::item_type::ItemType` type in Rust.
const itemTypes = [
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
const TY_PRIMITIVE = itemTypes.indexOf("primitive");
const TY_KEYWORD = itemTypes.indexOf("keyword");

// Max levenshtein distance.
const MAX_LEV_DISTANCE = 2;

class DocSearch {

    /**
     * Construct the DocSearch.
     * @param name the crate name
     * @param searchIndex the crate search index
     * @param rootPathCallback the root path callback to help dynamically get root path
     */
    constructor(name, searchIndex, rootPathCallback) {
        this.name = name;
        // The list of search words to query against.
        this.searchWords = [];
        this.searchIndex = this.buildIndex(searchIndex);
        this.getRootPath = rootPathCallback;

        // Current query lowercase keyword.
        this.valLower = null;
        this.split = null;
    }

    setSearchIndex(searchIndex) {
        this.searchIndex = this.buildIndex(searchIndex);
    }

    getSearchUrl(keyword) {
        let url = `${this.getRootPath()}${this.name}/index.html`;
        if (keyword) {
            url += `?search=${encodeURIComponent(keyword)}`;
        }
        return url;
    }

    search(query) {
        if (!query) return [];
        return this.execQuery(this.buildQuery(query));
    }

    buildIndex(rawSearchIndex) {
        let searchIndex = [];
        const searchWords = [];
        const charA = "A".charCodeAt(0);
        // if the rawSearchIndex is undefined or null, give it a empty object `{}`
        // to call iterate.
        for (let [crateName, indexItem] of Object.entries(rawSearchIndex || {})) {
            searchWords.push(crateName);
            searchIndex.push({
                crate: crateName,
                ty: 1, // == ExternCrate
                name: crateName,
                path: "",
                desc: indexItem.doc,
                type: null,
            });

            // https://github.com/rust-lang/rust/pull/83003
            // librustdoc has switched the search-index.js from a "array of struct" to a "struct of array" format.
            // We need to compat both the new and old formats.
            if (["t", "n", "q", "d", "i", "f", "p"].every(key => key in indexItem)) {
                // an array of (Number) item types (before 1.69.0) 
                // However, it changed since this PR: https://github.com/rust-lang/rust/pull/108013
                // a String of one character item type codes (since 1.69.0)
                const itemTypes = indexItem.t;
                // an array of (String) item names
                const itemNames = indexItem.n;
                // an array of (String) full paths (or empty string for previous path)
                const itemPaths = indexItem.q;
                // an array of (String) descriptions
                const itemDescs = indexItem.d;
                // an array of (Number) the parent path index + 1 to `paths`, or 0 if none
                const itemParentIdxs = indexItem.i;
                // an array of (Object | null) the type of the function, if any
                const itemFunctionSearchTypes = indexItem.f;
                // an array of [(Number) item type,
                //              (String) name]
                let paths = indexItem.p;

                // convert `paths` into an object form
                for (let i = 0; i < paths.length; ++i) {
                    if (Array.isArray(paths[i])) {
                        paths[i] = { ty: paths[i][0], name: paths[i][1] };
                    }
                }

                // convert `item*` into an object form, and construct word indices.
                //
                // before any analysis is performed lets gather the search terms to
                // search against apart from the rest of the data.  This is a quick
                // operation that is cached for the life of the page state so that
                // all other search operations have access to this cached data for
                // faster analysis operations
                let len = itemTypes.length;
                let lastPath = "";
                for (let i = 0; i < len; ++i) {
                    let ty = itemTypes[i];
                    let row = {
                        crate: crateName,
                        // itemTypes changed from number array to string since Rust 1.69,
                        // we should compat both versions.
                        // see this PR: https://github.com/rust-lang/rust/pull/108013 
                        ty: typeof ty === 'string' ? itemTypes.charCodeAt(i) - charA : ty,
                        name: itemNames[i],
                        path: itemPaths[i] ? itemPaths[i] : lastPath,
                        desc: itemDescs[i],
                        parent: itemParentIdxs[i] > 0 ? paths[itemParentIdxs[i] - 1] : undefined,
                        type: itemFunctionSearchTypes[i],
                    };
                    searchIndex.push(row);
                    if (typeof row.name === "string") {
                        let word = row.name.toLowerCase();
                        searchWords.push(word);
                    } else {
                        searchWords.push("");
                    }
                    lastPath = row.path;
                }
            } else {
                // an array of [(Number) item type,
                //              (String) name,
                //              (String) full path or empty string for previous path,
                //              (String) description,
                //              (Number | null) the parent path index to `paths`]
                //              (Object | null) the type of the function (if any)
                // Compat old style (items, paths) and new style (i, p)
                const items = indexItem.items || indexItem.i;

                // an array of [(Number) item type,
                //              (String) name]
                let paths = indexItem.paths || indexItem.p;

                // convert `paths` into an object form
                for (let i = 0; i < paths.length; ++i) {
                    if (Array.isArray(paths[i])) {
                        paths[i] = { ty: paths[i][0], name: paths[i][1] };
                    }
                }

                // convert `items` into an object form, and construct word indices.
                //
                // before any analysis is performed lets gather the search terms to
                // search against apart from the rest of the data.  This is a quick
                // operation that is cached for the life of the page state so that
                // all other search operations have access to this cached data for
                // faster analysis operations
                let len = items.length;
                let lastPath = "";
                for (let i = 0; i < len; ++i) {
                    const rawRow = items[i];
                    let row = {
                        crate: crateName,
                        ty: rawRow[0],
                        name: rawRow[1],
                        path: rawRow[2] || lastPath,
                        desc: rawRow[3],
                        parent: paths[rawRow[4]],
                        type: rawRow[5]
                    };
                    searchIndex.push(row);
                    if (typeof row.name === "string") {
                        let word = row.name.toLowerCase();
                        searchWords.push(word);
                    } else {
                        searchWords.push("");
                    }
                    lastPath = row.path;
                }
            }
        }
        this.searchWords = searchWords;
        return searchIndex;
    }

    buildQuery(raw) {
        let matches, type, query;
        query = raw;

        // let query = "fn:unwrap";
        // then the matches is ["fn:", "fn", index: 0, input: "fn:unwrap", groups: undefined]
        matches = query.match(/^(fn|mod|struct|enum|trait|type|const|macro|s|src)\s*:\s*/i);
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
            for (let i = 0; i < itemTypes.length; ++i) {
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
            let ret_lev = MAX_LEV_DISTANCE + 1;
            const path = ty.path.split("::");

            if (ty.parent && ty.parent.name) {
                path.push(ty.parent.name.toLowerCase());
            }

            if (contains.length > path.length) {
                return MAX_LEV_DISTANCE + 1;
            }
            for (let i = 0; i < path.length; ++i) {
                if (i + contains.length > path.length) {
                    break;
                }
                let lev_total = 0;
                let aborted = false;
                for (let x = 0; x < contains.length; ++x) {
                    const lev = levenshtein(path[i + x], contains[x]);
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
            const name = itemTypes[type];
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

        let val = this.valLower;
        const typeFilter = itemTypeFromName(query.type),
            results = Object.create(null)

        for (let z = 0; z < this.split.length; ++z) {
            if (this.split[z] === "") {
                this.split.splice(z, 1);
                z -= 1;
            }
        }

        const nSearchWords = this.searchWords.length;
        query.inputs = [val];
        query.output = val;
        query.search = val;
        // gather matching search results up to a certain maximum
        // val = val.replace(/\_/g, "");

        // var valGenerics = extractGenerics(val);

        const paths = this.valLower.split("::");
        let j;
        // "std::option::".split("::") => ["std", "option", ""]
        for (j = 0; j < paths.length; ++j) {
            if (paths[j] === "") {
                paths.splice(j, 1);
                j -= 1;
            }
        }
        val = paths[paths.length - 1];
        let contains = paths.slice(0, paths.length > 1 ? paths.length - 1 : 1);

        for (j = 0; j < nSearchWords; ++j) {
            let ty = this.searchIndex[j];
            if (!ty) {
                continue;
            }
            let lev_add = 0;
            if (paths.length > 1) {
                let lev = checkPath(contains, paths[paths.length - 1], ty);
                if (lev > MAX_LEV_DISTANCE) {
                    continue;
                } else if (lev > 0) {
                    lev_add = 1;
                }
            }

            let index = -1;
            // we want lev results to go lower than others
            let lev = MAX_LEV_DISTANCE + 1;
            const fullId = generateId(ty);

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
                        type: query.type,
                    };
                }
                results[fullId].lev = Math.min(results[fullId].lev, lev);
            }
        }

        return this.sortResults(results);
    }

    sortResults(results) {
        const ar = [];
        for (let entry of Object.values(results)) {
            ar.push(entry);
        }
        results = ar;
        const nresults = results.length;
        for (let i = 0; i < nresults; ++i) {
            results[i].word = this.searchWords[results[i].id];
            results[i].item = this.searchIndex[results[i].id] || {};
        }
        // if there are no results then return to default and fail
        if (results.length === 0) {
            return [];
        }

        const valLower = this.valLower;
        results.sort(function (aaa, bbb) {
            let a, b;

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

        for (let i = 0; i < results.length; ++i) {
            const result = results[i];

            // this validation does not make sense when searching by types
            if (result.dontValidate) {
                continue;
            }
            const name = result.item.name.toLowerCase(),
                path = result.item.path.toLowerCase(),
                parent = result.item.parent;

            if (this.validateResult(name, path, this.split, parent) === false) {
                result.id = -1;
            }
        }
        return this.transformResults(results);
    }

    transformResults(results, isType) {
        const out = [];
        for (let i = 0; i < results.length; ++i) {
            if (results[i].id > -1) {
                const obj = this.searchIndex[results[i].id];
                obj.lev = results[i].lev;
                if (isType !== true || obj.type) {
                    const res = this.buildHrefAndPath(obj);
                    // obj.displayPath = pathSplitter(res[0]);
                    obj.displayPath = res[0];
                    obj.fullPath = obj.displayPath + obj.name;
                    // To be sure than it some items aren't considered as duplicate.
                    // obj.fullPath += '|' + obj.ty;
                    obj.href = res[1];
                    // The queryType mean 'fn', 'trait', 'src' search types.
                    // See buildQuery() method.
                    obj.queryType = results[i].type;
                    out.push(obj);
                }
            }
        }
        return out;
    }

    buildHrefAndPath(item) {
        let rootPath = this.getRootPath();
        let displayPath;
        let href;
        const type = itemTypes[item.ty];
        const name = item.name;
        let path = item.path;

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
            const myparent = item.parent;
            let anchor = "#" + type + "." + name;
            const parentType = itemTypes[myparent.ty];
            let pageType = parentType;
            let pageName = myparent.name;

            if (parentType === "primitive") {
                displayPath = myparent.name + "::";
            } else if (type === "structfield" && parentType === "variant") {
                // Structfields belonging to variants are special: the
                // final path element is the enum name.
                const splitPath = item.path.split("::");
                const enumName = splitPath.pop();
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
        return [displayPath, href];
    }


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
     * @return {boolean}       [Whether the result is valid or not]
     */
    validateResult(name, path, keys, parent) {
        for (let i = 0; i < keys.length; ++i) {
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