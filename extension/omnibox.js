let MAX_SUGGRST_PAGE = 10;
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
        this.suggestResults.push({content, description});
    }
};

Omnibox.prototype.parse = function(input) {
    let parsePage = (arg) => {
        return [...arg].filter(c => c === "+").length + 1;
    };
    let args = input.toLowerCase().trim().split(" ");
    let scope = undefined, query = undefined, page = 1;
    if (args.length === 1) {
        query = args[0];
    } else if (args.length === 2) {
        if (args[1].startsWith("+")) {
            query = args[0];
            page = parsePage(args[1]);
        } else {
            scope = args[0];
            query = args[1];
        }
    } else if (args.length > 2) {
        scope = args[0];
        query = args[1];
        page = parsePage(args[1]);
    }
    return {scope, query, page};
};

Omnibox.prototype.bootstrap = function({onSearch, onFormat, onAppend}) {
    this.setDefaultSuggestion(this.defaultSuggestionDescription);

    this.browser.omnibox.onInputChanged.addListener(async (input, suggestFn) => {
        this.defaultSuggestionContent = null;
        if (!input) {
            this.setDefaultSuggestion(this.defaultSuggestionDescription);
            return;
        }
        let {scope, query, page} = this.parse(input);
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
                if (this.suggestResults.length < MAX_SUGGEST_SIZE * MAX_SUGGRST_PAGE) {
                    this.appendResult(event.onSearch(query), event.onFormat);
                }
            }
            this.appendResult(onAppend(query));
        }
        let result = this.suggestResults.slice(MAX_SUGGEST_SIZE * (page - 1), MAX_SUGGEST_SIZE * page);
        if (result.length > 0) {
            let {content, description} = result.shift();
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