const compat = new Compat();
const deminifier = new Deminifier(mapping);
const crateSearcher = new CrateSearch(crateIndex);
const attributeSearcher = new AttributeSearch();
const command = new Command();

const defaultSuggestion = `Search ${compat.match("std docs")}, ${compat.match("crates")} (!), ${compat.match("builtin attributes")} (#), ${compat.match("error codes")} in your address bar instantly!`;
const omnibox = new Omnibox(compat.browser, defaultSuggestion, compat.isChrome ? 8 : 6);

omnibox.bootstrap({
    onSearch: (query) => {
        return window.search(query);
    },
    onFormat: (index, doc) => {
        let description = doc.displayPath + compat.match(doc.name);
        if (doc.desc) {
            description += " - " + compat.dim(compat.escape(doc.desc));
        }
        return {content: doc.href, description};
    },
    onAppend: (query) => {
        return [{
            content: `${window.rootPath}std/index.html?search=` + encodeURIComponent(query),
            description: `Search Rust docs ${ compat.match(query) } on ${ settings.isOfflineMode ? "offline mode" : "https://doc.rust-lang.org"}`,
        }]
    },
});

omnibox.addPrefixQueryEvent("!", {
    defaultSearch: true,
    searchPriority: 1,
    onSearch: (query) => {
        this.docMode = query.startsWith("!!");
        this.rawQuery = query.replace(/[!\s]/g, "");
        query = this.rawQuery.replace(/[-_]*/ig, "");
        return crateSearcher.search(query);
    },
    onFormat: (index, crate) => {
        return {
            // Dash and underscore is unequivalent on docs.rs right now.
            // See issue https://github.com/rust-lang/docs.rs/issues/105
            content: this.docMode ? `https://docs.rs/${crate.id.replace("_", "-")}` : `https://crates.io/crates/${crate.id}`,
            description: `${this.docMode ? "Docs" : "Crate"}: ${compat.match(crate.id)} v${crate.version} - ${compat.dim(compat.escape(crate.description))}`,
        };
    },
    onAppend: () => {
        return [{
            content: "https://crates.io/search?q=" + encodeURIComponent(this.rawQuery),
            description: "Search Rust crates for " + compat.match(this.rawQuery) + " on https://crates.io",
        }];
    }
});

omnibox.addPrefixQueryEvent("#", {
    defaultSearch: true,
    searchPriority: 2,
    onSearch: (query) => {
        return attributeSearcher.search(query);
    },
    onFormat: (index, attribute) => {
        return {
            content: attribute.href + `?${index}`,
            description: `Attribute: ${compat.match("#[" + attribute.name + "]")} ${compat.dim(attribute.description)}`,
        }
    }
});

omnibox.addRegexQueryEvent(/e\d{2,4}$/i, {
    onSearch: (query) => {
        let baseIndex = parseInt(query.slice(1).padEnd(4, '0'));
        let result = [];
        for (let index = 0; index < 10; index++) {
            let errorIndex = 'E' + String(baseIndex++).padStart(4, "0").toUpperCase();
            result.push(errorIndex);
        }
        return result;
    },
    onFormat: (index, errorCode) => {
        return {
            content: "https://doc.rust-lang.org/error-index.html#" + errorCode,
            description: `Search Rust error index for ${compat.match(errorCode)} on https://doc.rust-lang.org/error-index.html`,
        };
    }
});

omnibox.addPrefixQueryEvent(":", {
    onSearch: (query) => {
        return command.execute(query);
    },
});

window.crateSearcher = crateSearcher;
window.deminifier = deminifier;