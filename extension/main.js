const c = new Compat();
const deminifier = new Deminifier(mapping);
const crateSearcher = new CrateSearch(crateIndex);
const attributeSearcher = new AttributeSearch();
const bookSearcher = new BookSearch(booksIndex);
const lintSearcher = new LintSearch(lintsIndex);
const stdSearcher = new StdSearch(searchIndex);
const crateDocSearchManager = new CrateDocSearchManager();
const commandManager = new CommandManager();

const defaultSuggestion = `Search std ${c.match("docs")}, ${c.match("crates")} (!), builtin ${c.match("attributes")} (#), official ${c.match("books")} (%), and ${c.match("error codes")}, etc in your address bar instantly!`;
const omnibox = new Omnibox(c.browser, defaultSuggestion, c.isChrome ? 8 : 6);

let onDocFormat = (index, doc) => {
    let description = doc.displayPath + c.match(doc.name);
    if (doc.desc) {
        description += " - " + c.dim(c.escape(doc.desc));
    }
    return {content: doc.href, description};
};

omnibox.bootstrap({
    onSearch: (query) => {
        return stdSearcher.search(query);
    },
    onFormat: onDocFormat,
    onAppend: (query) => {
        return [{
            content: `${stdSearcher.rootPath}std/index.html?search=` + encodeURIComponent(query),
            description: `Search Rust docs ${c.match(query)} on ${settings.isOfflineMode ? "offline mode" : stdSearcher.rootPath}`,
        }];
    },
    onSelected: (query, result) => {
        HistoryCommand.record(query, result);
    }
});

omnibox.addPrefixQueryEvent("@", {
    onSearch: (query) => {
        return crateDocSearchManager.search(query);
    },
    onFormat: onDocFormat,
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

omnibox.addPrefixQueryEvent("%", {
    onSearch: (query) => {
        return bookSearcher.search(query);
    },
    onFormat: (index, page) => {
        let parentTitles = page.parentTitles || [];
        return {
            content: page.url,
            description: `${[...parentTitles.map(t => c.escape(t)), c.match(c.escape(page.title))].join(" > ")} - ${c.dim(page.name)}`
        }
    }
});

const LINT_URL = "https://rust-lang.github.io/rust-clippy/master/";
omnibox.addPrefixQueryEvent(">", {
    onSearch: (query) => {
        return lintSearcher.search(query);
    },
    onFormat: (index, lint) => {
        return {
            content: `${LINT_URL}#${lint.name}`,
            description: `Clippy lint: [${lint.level}] ${c.match(lint.name)} - ${c.dim(c.escape(lint.description))}`,
        }
    },
});

omnibox.addPrefixQueryEvent(":", {
    onSearch: (query) => {
        return commandManager.execute(query);
    },
});

window.crateSearcher = crateSearcher;
window.deminifier = deminifier;