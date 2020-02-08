let MAX_SUGGEST_SIZE = 8;

function Omnibox() {
    this.isChrome = window.isChrome;
    this.browser = window.browser;
    // Firefox doesn't support tags in search suggestion.
    this.tagged = this.isChrome ?
        (tag, str) => `<${tag}>${str}</${tag}>` :
        (_, str) => str;
    this.match = (str) => this.tagged("match", str);
    this.dim = (str) => this.tagged("dim", str);
    // Escape the five predefined entities to display them as text.
    this.escape = (str) => {
        str = str || "";
        return this.isChrome ? str
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;")
            : str;
    };

    this.defaultSuggestionDescription = `Search ${this.match("std docs")}, ${this.match("crates")} (!), ${this.match("builtin attributes")} (#), ${this.match("error codes")} in your address bar instantly!`;
    this.defaultSuggestionContent = null;
    this.appendResult = (index, content, description) => {
        if (index === 0 && !this.defaultSuggestionContent) {
            this.setDefaultSuggestion(description, content)
        } else {
            this.suggestResults.push({content, description});
        }
    }
}

Omnibox.prototype.setDefaultSuggestion = function(description, content) {
    this.browser.omnibox.setDefaultSuggestion({
        description: description
    });

    if (content) {
        this.defaultSuggestionContent = content;
    }
};

Omnibox.prototype.bootstrap = async function() {
    this.setDefaultSuggestion(this.defaultSuggestionDescription);

    this.browser.omnibox.onInputChanged.addListener(async (query, suggestFn) => {
        this.defaultSuggestionContent = null;
        if (!query) {
            this.setDefaultSuggestion(this.defaultSuggestionDescription);
            return;
        }

        this.suggestResults = [];
        if (query.startsWith("#")) {
            this.appendAttributesResult(query);
        } else if (query.startsWith("!")) {
            await this.appendCratesResult(query);
        } else if (/e\d{2,4}$/ig.test(query)) {
            this.appendErrorIndexResult(query);
        } else {
            this.appendDocumentationResult(query);

            if (this.suggestResults.length < MAX_SUGGEST_SIZE) {
                this.appendAttributesResult(query);
            }

            if (this.suggestResults.length < MAX_SUGGEST_SIZE) {
                await this.appendCratesResult(query);
            }

            this.appendResult(
                this.suggestResults.length,
                `${window.rootPath}std/index.html?search=` + encodeURIComponent(query),
                `Search Rust docs ${ this.match(query) } on ${ settings.isOfflineMode ? "offline mode" : "https://doc.rust-lang.org"}`,
            );
        }

        suggestFn(this.suggestResults);
    });

    this.browser.omnibox.onInputEntered.addListener(content => {
        if (/^https?:\/\//i.test(content) || /^file:\/\//i.test(content)) {
            this.navigateToUrl(content);
        } else {
            this.navigateToUrl(this.defaultSuggestionContent);
        }

        this.setDefaultSuggestion(this.defaultSuggestionDescription);
    });
};

Omnibox.prototype.appendDocumentationResult = function(query) {
    const docs = window.search(query);

    for (let [index, doc] of docs.entries()) {
        let description = doc.displayPath + this.match(doc.name);
        if (doc.desc) {
            description += " - " + this.dim(this.escape(doc.desc));
        }
        this.appendResult(index, doc.href, description);
    }
};

Omnibox.prototype.appendErrorIndexResult = function(query, length = 10) {
    let baseIndex = parseInt(query.slice(1).padEnd(4, '0'));

    for (let index = 0; index < length; index++) {
        let errorIndex = 'E' + String(baseIndex++).padStart(4, "0");
        let [content, description] = [
            "https://doc.rust-lang.org/error-index.html#" + errorIndex.toUpperCase(),
            `Search Rust error index for ${this.match(errorIndex.toUpperCase())} on https://doc.rust-lang.org/error-index.html`,
        ];
        this.appendResult(index, content, description);
    }
};

Omnibox.prototype.appendCratesResult = async function(query) {
    let docMode = query.startsWith("!!");
    query = query.replace(/[-_\s!]*/ig, "");
    let crates = await crateSearcher.search(query);

    for (let [index, crate] of crates.entries()) {
        let [content, description] = [
            docMode ? `https://docs.rs/${crate.id}` : `https://crates.io/crates/${crate.id}`,
            `${docMode ? "Docs" : "Crate"}: ${this.match(crate.id)} v${crate.version} - ${this.dim(this.escape(crate.description))}`,
        ];
        this.appendResult(index, content, description);
    }

    this.appendResult(
        this.suggestResults.length,
        "https://crates.io/search?q=" + encodeURIComponent(query),
        "Search Rust crates for " + this.match(query) + " on https://crates.io"
    );
};

Omnibox.prototype.appendAttributesResult = function(query) {
    let attributes = attributeSearcher.search(query);

    for (let [index, attr] of attributes.entries()) {
        let [content, description] = [
            attr.href,
            `Attribute: ${this.match("#[" + attr.name + "]")} ${attr.description}`,
        ];
        this.appendResult(index, content, description);
    }
};

Omnibox.prototype.navigateToUrl = function(url) {
    if (settings.openType === "current-tab") {
        this.browser.tabs.query({active: true}, tab => {
            this.browser.tabs.update(tab.id, {url: url});
        });
    } else {
        this.browser.tabs.create({url: url});
    }
};
