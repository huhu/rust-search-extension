let PAGE_TURNER = "-";

function Omnibox(defaultSuggestion, maxSuggestionSize = 8) {
    this.maxSuggestionSize = maxSuggestionSize;
    this.defaultSuggestionDescription = defaultSuggestion;
    this.defaultSuggestionContent = null;
    this.queryEvents = [];
    // Cache the last query and result to speed up the page down.
    this.cachedQuery = null;
    this.cachedResult = null;
}

Omnibox.prototype.setDefaultSuggestion = function(description, content) {
    chrome.omnibox.setDefaultSuggestion({description});

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
        // Case: {keyword} {page-turner}
        query = [args[0]];
        page = parsePage(args[1]);
    } else if (args.length >= 2) {
        // Case: {keyword} {keyword} {page-turner}
        query = [args[0], args[1]];
        if (args[2] && args[2].startsWith(PAGE_TURNER)) {
            page = parsePage(args[2]);
        }
    }
    return {query: query.join(" "), page};
};

Omnibox.prototype.bootstrap = function({onSearch, onFormat, onAppend, onSelected}) {
    this.globalEvent = new QueryEvent({onSearch, onFormat, onAppend});
    this.setDefaultSuggestion(this.defaultSuggestionDescription);
    let results;
    let defaultDescription;

    chrome.omnibox.onInputChanged.addListener(async (input, suggestFn) => {
        this.defaultSuggestionContent = null;
        if (!input) {
            this.setDefaultSuggestion(this.defaultSuggestionDescription);
            return;
        }
        let {query, page} = this.parse(input);
        if (this.cachedQuery === query) {
            results = this.cachedResult;
        } else {
            results = this.performSearch(query);
            this.cachedQuery = query;
            this.cachedResult = results;
        }

        let totalPage = Math.ceil(results.length / this.maxSuggestionSize);
        results = results.slice(this.maxSuggestionSize * (page - 1), this.maxSuggestionSize * page);
        if (results.length > 0) {
            let {content, description} = results.shift();
            // Store the default description temporary.
            defaultDescription = description;
            description += ` | Page [${page}/${totalPage}], append '${PAGE_TURNER}' to page down`;
            this.setDefaultSuggestion(description, content);
        }
        suggestFn(results);
    });

    chrome.omnibox.onInputEntered.addListener((content, disposition) => {
        let result;
        if (/^(https?|file):\/\//i.test(content)) {
            this.navigateToUrl(content, disposition);
            result = results.find(item => item.content === content);
        } else {
            if (/^(https?|file):\/\//i.test(this.defaultSuggestionContent)) {
                this.navigateToUrl(this.defaultSuggestionContent, disposition);
                result = {
                    content: this.defaultSuggestionContent,
                    description: defaultDescription,
                };
            }
        }

        if (onSelected) {
            onSelected(this.cachedQuery, result);
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
            result.push(...event.performSearch(query));
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

// Disposition rules:
// - currentTab: enter (default)
// - newForegroundTab: alt + enter
// - newBackgroundTab: meta + enter
Omnibox.prototype.navigateToUrl = function(url, disposition) {
    url = url.replace(/\?\d$/ig, "");
    if (disposition === "currentTab") {
        chrome.tabs.query({active: true}, tab => {
            chrome.tabs.update(tab.id, {url});
        });
    } else {
        // newForegroundTab, newBackgroundTab
        chrome.tabs.create({url});
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