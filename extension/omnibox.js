let MAX_SUGGEST_PAGE = 10;
let PAGE_TURNER = "-";

function Omnibox(browser, defaultSuggestion, maxSuggestionSize = 8) {
    this.browser = browser;
    this.maxSuggestionSize = maxSuggestionSize;
    this.defaultSuggestionDescription = defaultSuggestion;
    this.defaultSuggestionContent = null;
    this.queryEvents = [];
}

Omnibox.prototype.setDefaultSuggestion = function(description, content) {
    this.browser.omnibox.setDefaultSuggestion({description});

    if (content) {
        this.defaultSuggestionContent = content;
    }
};

Omnibox.prototype.appendResult = function(result, formatter = undefined, deduplicate = false) {
    for (let [index, item] of result.entries()) {
        if (formatter) {
            item = formatter(index, item);
        }
        let {content, description} = item;
        if (deduplicate) {
            // Deduplicate content
            content += `?${index}`
        }
        this.suggestResults.push({content, description});
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
    this.setDefaultSuggestion(this.defaultSuggestionDescription);

    this.browser.omnibox.onInputChanged.addListener(async (input, suggestFn) => {
        this.defaultSuggestionContent = null;
        if (!input) {
            this.setDefaultSuggestion(this.defaultSuggestionDescription);
            return;
        }
        let {query, page} = this.parse(input);
        this.suggestResults = [];
        let matchedEvent = this.queryEvents.find(event => {
            return (event.prefix && query.startsWith(event.prefix)) || (event.regex && event.regex.test(query));
        });

        if (matchedEvent) {
            let event = matchedEvent;
            this.appendResult(event.onSearch(query), event.onFormat, event.deduplicate);
            if (event.onAppend) {
                this.appendResult(event.onAppend(query), null, event.deduplicate);
            }
        } else {
            this.appendResult(onSearch(query), onFormat);

            let defaultSearchEvents = this.queryEvents
                .filter(event => event.defaultSearch)
                .sort((a, b) => b.searchPriority - a.searchPriority);
            for (let event of defaultSearchEvents) {
                if (this.suggestResults.length < this.maxSuggestionSize * MAX_SUGGEST_PAGE) {
                    this.appendResult(event.onSearch(query), event.onFormat, event.deduplicate);
                }
            }
            this.appendResult(onAppend(query));
        }
        let totalPage = Math.ceil(this.suggestResults.length / this.maxSuggestionSize);
        let result = this.suggestResults.slice(this.maxSuggestionSize * (page - 1), this.maxSuggestionSize * page);
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

Omnibox.prototype.addPrefixQueryEvent = function(prefix, event) {
    this.addQueryEvent({prefix, ...event,});
};

Omnibox.prototype.addRegexQueryEvent = function(regex, event) {
    this.addQueryEvent({regex, ...event,});
};

Omnibox.prototype.addQueryEvent = function(
    {
        onSearch, onFormat, onAppend,
        prefix = undefined, regex = undefined,
        defaultSearch = false, searchPriority = 0, deduplicate = false
    }
) {
    this.queryEvents.push({
        prefix,
        regex,
        defaultSearch,
        searchPriority,
        deduplicate,
        onSearch,
        onFormat,
        onAppend,
    });
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