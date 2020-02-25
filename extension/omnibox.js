let MAX_SUGGEST_PAGE = 10;
let PAGE_TURNER = "-";

function Omnibox(browser, defaultSuggestion, maxSuggestionSize = 8) {
    this.browser = browser;
    this.maxSuggestionSize = maxSuggestionSize;
    this.defaultSuggestionDescription = defaultSuggestion;
    this.defaultSuggestionContent = null;
    this.queryEvents = [];
    // Cache the last query and result to speed up the page down.
    this.cachedQuery = null;
    this.cachedResult = null;
}

Omnibox.prototype.setDefaultSuggestion = function(description, content) {
    this.browser.omnibox.setDefaultSuggestion({description});

    if (content) {
        this.defaultSuggestionContent = content;
    }
};

Omnibox.prototype.parse = function(input) {
    let parsePage = (arg) => {
        return [...arg].filter(c => c === PAGE_TURNER).length + 1;
    };
    let args = input.toLowerCase().trim().split(" ");
    let query = undefined, page = 1;
    if (args.length === 1) {
        // Case: {keyword}
        query = [args[0]];
    } else if (args.length === 2 && args[1].startsWith(PAGE_TURNER)) {
        // Case: {keyword} {page-tuner}
        query = [args[0]];
        page = parsePage(args[1]);
    } else if (args.length >= 2) {
        // Case: {keyword} {keyword} {page-tuner}
        query = [args[0], args[1]];
        if (args[2] && args[2].startsWith(PAGE_TURNER)) {
            page = parsePage(args[2]);
        }
    }
    return {query: query.join(" "), page};
};

Omnibox.prototype.bootstrap = function({onSearch, onFormat, onAppend}) {
    this.globalEvent = new QueryEvent({onSearch, onFormat, onAppend});
    this.setDefaultSuggestion(this.defaultSuggestionDescription);

    this.browser.omnibox.onInputChanged.addListener(async (input, suggestFn) => {
        this.defaultSuggestionContent = null;
        if (!input) {
            this.setDefaultSuggestion(this.defaultSuggestionDescription);
            return;
        }
        let {query, page} = this.parse(input);
        let result;
        if (this.cachedQuery === query) {
            result = this.cachedResult;
        } else {
            result = this.performSearch(query);
            this.cachedQuery = query;
            this.cachedResult = result;
        }

        let totalPage = Math.ceil(result.length / this.maxSuggestionSize);
        result = result.slice(this.maxSuggestionSize * (page - 1), this.maxSuggestionSize * page);
        if (result.length > 0) {
            let {content, description} = result.shift();
            description += ` | Page [${page}/${totalPage}], append '${PAGE_TURNER}' to page down`;
            this.setDefaultSuggestion(description, content);
        }
        suggestFn(result);
    });

    this.browser.omnibox.onInputEntered.addListener(content => {
        if (/^(https?|file):\/\//i.test(content)) {
            this.navigateToUrl(content);
        } else {
            if (/^(https?|file):\/\//i.test(this.defaultSuggestionContent)) {
                this.navigateToUrl(this.defaultSuggestionContent);
            }
        }

        this.setDefaultSuggestion(this.defaultSuggestionDescription);
    });
};

Omnibox.prototype.performSearch = function(query) {
    let result;
    let matchedEvent = this.queryEvents.find(event => {
        return (event.prefix && query.startsWith(event.prefix)) || (event.regex && event.regex.test(query));
    });

    if (matchedEvent) {
        result = matchedEvent.performSearch(query);
        if (matchedEvent.onAppend) {
            result.push(...matchedEvent.onAppend(query));
        }
    } else {
        result = this.globalEvent.performSearch(query);
        let defaultSearchEvents = this.queryEvents
            .filter(event => event.defaultSearch)
            .sort((a, b) => b.searchPriority - a.searchPriority);
        for (let event of defaultSearchEvents) {
            if (result.length < this.maxSuggestionSize * MAX_SUGGEST_PAGE) {
                result.push(...event.performSearch(query));
            }
        }
        result.push(...this.globalEvent.onAppend(query));
    }
    return result;
};

Omnibox.prototype.addPrefixQueryEvent = function(prefix, event) {
    this.queryEvents.push(new QueryEvent({
        prefix,
        ...event,
    }));
};

Omnibox.prototype.addRegexQueryEvent = function(regex, event) {
    this.queryEvents.push(new QueryEvent({
        regex,
        ...event,
    }));
};

Omnibox.prototype.navigateToUrl = function(url) {
    url = url.replace(/\?\d$/ig, "");
    if (settings.openType === "current-tab") {
        this.browser.tabs.query({active: true}, tab => {
            this.browser.tabs.update(tab.id, {url: url});
        });
    } else {
        this.browser.tabs.create({url: url});
    }
};

class QueryEvent {
    constructor({
                    onSearch, onFormat, onAppend,
                    prefix = undefined, regex = undefined,
                    defaultSearch = false, searchPriority = 0, deduplicate = false
                }) {
        this.onSearch = onSearch;
        this.onFormat = onFormat;
        this.onAppend = onAppend;
        this.prefix = prefix;
        this.regex = regex;
        this.defaultSearch = defaultSearch;
        this.searchPriority = searchPriority;
        this.deduplicate = deduplicate;
    }

    performSearch(input) {
        let result = this.onSearch(input);
        return result.map((item, index) => {
            if (this.onFormat) {
                item = this.onFormat(index, item);
            }
            let {content, description} = item;
            if (this.deduplicate) {
                // Deduplicate content
                content += `?${index}`
            }
            return {content, description};
        });
    }
}