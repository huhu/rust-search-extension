let MAX_SUGGEST_SIZE = 8;

function Omnibox(browser, defaultSuggestion) {
    this.browser = browser;
    this.defaultSuggestionDescription = defaultSuggestion;
    this.defaultSuggestionContent = null;
    this.queryEvents = [];
}

Omnibox.prototype.setDefaultSuggestion = function(description, content) {
    this.browser.omnibox.setDefaultSuggestion({
        description: description
    });

    if (content) {
        this.defaultSuggestionContent = content;
    }
};

Omnibox.prototype.appendResult = function(result, formatter) {
    for (let [index, item] of result.entries()) {
        if (formatter) {
            item = formatter(index, item);
        }
        let {content, description} = item;
        if (index === 0 && !this.defaultSuggestionContent) {
            this.setDefaultSuggestion(description, content);
        } else {
            this.suggestResults.push({content, description});
        }
    }
};

Omnibox.prototype.bootstrap = function({onSearch, onFormat, onAppend}) {
    this.setDefaultSuggestion(this.defaultSuggestionDescription);

    this.browser.omnibox.onInputChanged.addListener(async (query, suggestFn) => {
        this.defaultSuggestionContent = null;
        if (!query) {
            this.setDefaultSuggestion(this.defaultSuggestionDescription);
            return;
        }

        this.suggestResults = [];
        let matchedEvent = this.queryEvents.find(event => {
            return (event.prefix && query.startsWith(event.prefix)) || (event.regex && event.regex.test(query));
        });

        if (matchedEvent) {
            this.appendResult(matchedEvent.onSearch(query), matchedEvent.onFormat);
            if (matchedEvent.onAppend) {
                this.appendResult(matchedEvent.onAppend(query));
            }
        } else {
            this.appendResult(onSearch(query), onFormat);

            let defaultSearchEvents = this.queryEvents
                .filter(event => event.defaultSearch)
                .sort((a, b) => b.searchPriority - a.searchPriority);
            for (let event of defaultSearchEvents) {
                if (this.suggestResults.length < MAX_SUGGEST_SIZE) {
                    this.appendResult(event.onSearch(query), event.onFormat);
                }
            }
            this.appendResult(onAppend(query));
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

Omnibox.prototype.addPrefixQueryEvent = function(prefix, event) {
    this.addQueryEvent({prefix, ...event,});
};

Omnibox.prototype.addRegexQueryEvent = function(regex, event) {
    this.addQueryEvent({regex, ...event,});
};

Omnibox.prototype.addQueryEvent = function(
    {onSearch, onFormat, onAppend, prefix = undefined, regex = undefined, defaultSearch = false, searchPriority = 0}
) {
    this.queryEvents.push({
        prefix,
        regex,
        defaultSearch,
        searchPriority,
        onSearch,
        onFormat,
        onAppend,
    });
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