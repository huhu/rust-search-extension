const c = new Compat();
const deminifier = new Deminifier(mapping);
const crateSearcher = new CrateSearch(crateIndex);
const attributeSearcher = new AttributeSearch();
const bookSearcher = new BookSearch(booksIndex);
const command = new Command();

const defaultSuggestion = `Search std ${c.match("docs")}, ${c.match("crates")} (!), builtin ${c.match("attributes")} (#), official ${c.match("books")} (%), and ${c.match("error codes")}, etc in your address bar instantly!`;
const omnibox = new Omnibox(c.browser, defaultSuggestion, c.isChrome ? 8 : 6);

omnibox.bootstrap({
    onSearch: (query) => {
        return window.search(query);
    },
    onFormat: (index, doc) => {
        let description = doc.displayPath + c.match(doc.name);
        if (doc.desc) {
            description += " - " + c.dim(c.escape(doc.desc));
        }
        return {content: doc.href, description};
    },
    onAppend: (query) => {
        return [{
            content: `${window.rootPath}std/index.html?search=` + encodeURIComponent(query),
            description: `Search Rust docs ${ c.match(query) } on ${ settings.isOfflineMode ? "offline mode" : "https://doc.rust-lang.org"}`,
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
            description: `${this.docMode ? "Docs" : "Crate"}: ${c.match(crate.id)} v${crate.version} - ${c.dim(c.escape(crate.description))}`,
        };
    },
    onAppend: () => {
        return [{
            content: "https://crates.io/search?q=" + encodeURIComponent(this.rawQuery),
            description: "Search Rust crates for " + c.match(this.rawQuery) + " on https://crates.io",
        }, {
            content: "remind",
            description: `Remind: ${c.dim("We only indexed the top 20K crates. Sorry for the inconvenience if your desired crate not show.")}`,
        }];
    }
});

omnibox.addPrefixQueryEvent("#", {
    defaultSearch: true,
    searchPriority: 2,
    deduplicate: true,
    onSearch: (query) => {
        return attributeSearcher.search(query);
    },
    onFormat: (index, attribute) => {
        return {
            content: attribute.href,
            description: `Attribute: ${c.match("#[" + attribute.name + "]")} ${c.dim(attribute.description)}`,
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
            description: `Search Rust error index for ${c.match(errorCode)} on https://doc.rust-lang.org/error-index.html`,
        };
    }
});

omnibox.addPrefixQueryEvent(":", {
    onSearch: (query) => {
        return command.execute(query);
    },
});

omnibox.addPrefixQueryEvent("%", {
    onSearch: (query) => {
        return bookSearcher.search(query);
    },
    onFormat: (index, page) => {
        let parentTitles = page.parentTitles || [];
        return {
            content: page.url,
            description: `${ [...parentTitles.map(t => c.escape(t)), c.match(c.escape(page.title))].join(" > ") } - ${c.dim(page.name)}`
        }
    }
});

window.crateSearcher = crateSearcher;
window.deminifier = deminifier;