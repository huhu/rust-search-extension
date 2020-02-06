let MAX_SUGGEST_SIZE = 8;

function Omnibox() {
    this.isChrome = navigator.userAgent.indexOf("Chrome") !== -1;
    // Firefox doesn't support tags in search suggestion.
    this.tagged = this.isChrome ?
        (tag, str) => `<${tag}>${str}</${tag}>` :
        (_, str) => str;
    this.match = (str) => this.tagged("match", str);
    this.dim = (str) => this.tagged("dim", str);

    this.browser = this.isChrome ? window.chrome : window.browser;
    this.defaultSuggestionDescription = `Search ${this.match("std docs")}, ${this.match("crates")} (!), ${this.match("builtin attributes")} (#), ${this.match("error codes")} in your address bar instantly!`;
    this.defaultSuggestionContent = null;
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
                await this.appendAttributesResult(query);
            }

            if (this.suggestResults.length < MAX_SUGGEST_SIZE) {
                await this.appendCratesResult(query);
            }

            this.suggestResults.push({
                content: `${window.rootPath}std/index.html?search=` + encodeURIComponent(query),
                description: `Search Rust docs ${ this.match(query) } on ${ settings.isOfflineMode ? "offline mode" : "https://doc.rust-lang.org"}`,
            });
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

    if (!this.defaultSuggestionContent && docs.length > 0) {
        let doc = docs.shift();
        let description = doc.displayPath + this.match(doc.name);
        if (doc.desc) {
            description += " - " + this.dim(this.escape(doc.desc));
        }
        this.setDefaultSuggestion(
            description,
            doc.href,
        );
    }

    for (let doc of docs) {
        let description = doc.displayPath + this.match(doc.name);
        if (doc.desc) {
            description += " - " + this.dim(this.escape(doc.desc));
        }
        this.suggestResults.push({
            content: doc.href,
            description: description,
        });
    }
};

Omnibox.prototype.appendErrorIndexResult = function(query, length = 10) {
    let baseIndex = parseInt(query.slice(1).padEnd(4, '0'));
    for (let i = 1; i <= length; i++) {
        let errorIndex = 'E' + String(baseIndex++).padStart(4, "0");
        this.suggestResults.push({
            content: "https://doc.rust-lang.org/error-index.html#" + errorIndex.toUpperCase(),
            description: "Search Rust error index for " + this.match(errorIndex.toUpperCase())
            + " on https://doc.rust-lang.org/error-index.html"
        });
    }
};

Omnibox.prototype.appendCratesResult = async function(query) {
    let crates = await crateSearcher.search(query);

    if (!this.defaultSuggestionContent && crates.length > 0) {
        let crate = crates.shift();
        this.setDefaultSuggestion(
            `Crate: ${this.match(crate.id)} v${crate.version} - ${this.dim(this.escape(crate.description))}`,
            `https://crates.io/crates/${crate.id}`,
        );
    }

    for (let crate of crates) {
        this.suggestResults.push({
            content: `https://crates.io/crates/${crate.id}`,
            description: `Crate: ${this.match(crate.id)} v${crate.version} - ${this.dim(this.escape(crate.description))}`,
        });
    }
    this.suggestResults.push({
        content: "https://crates.io/search?q=" + encodeURIComponent(query),
        description: "Search Rust crates for " + this.match(query) + " on https://crates.io"
    });
};

Omnibox.prototype.appendAttributesResult = function(query) {
    let attributes = attributeSearcher.search(query);
    if (!this.defaultSuggestionContent && attributes.length > 0) {
        let attr = attributes.shift();
        this.setDefaultSuggestion(
            `Attribute: ${this.match("#[" + attr.name + "]")} ${attr.description}`,
            attr.href,
        );
    }

    for (let attr of attributes) {
        this.suggestResults.push({
            content: attr.href,
            description: `Attribute: ${this.match("#[" + attr.name + "]")} ${attr.description}`,
        });
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

// Escape the five predefined entities to display them as text.
Omnibox.prototype.escape = function(text) {
    text = text || "";
    return this.isChrome ? text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
        : text;
};