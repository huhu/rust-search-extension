setup();

function setup() {
    chrome.omnibox.setDefaultSuggestion({
        description: "Search Rust crates for <match>%s</match>"
    });

    chrome.omnibox.onInputChanged.addListener(function(query, suggestFn) {
        if (!query) return;

        var searchResults = window.search(query);
        var suggestResults = [];
        for (var i = 0; i < searchResults.length; i++) {
            var result = searchResults[i];
            suggestResults.push({
                content: result.href,
                description: buildDescription(result)
            })
        }

        if (suggestResults.length === 0) {
            suggestResults = [
                {
                    content: "https://doc.rust-lang.org/stable/std/?search=" + query,
                    description: "Sorry, no Rust official documentation result about <match>" + query
                    + "</match> found, click here to search on <dim>doc.rust-lang.org</dim>"
                }
            ]
        }

        suggestFn(suggestResults);
    });

    chrome.omnibox.onInputEntered.addListener(function(text) {
        if (text && text.startsWith(window.rootPath)) {
            navigateToUrl(text);
        } else {
            navigateToUrl('https://crates.io/search?q=' + encodeURIComponent(text));
        }
    });
}

function navigateToUrl(url) {
    chrome.tabs.getSelected(null, function(tab) {
        chrome.tabs.update(tab.id, {url: url});
    });
}

function buildDescription(item) {
    if (item) {
        return item.displayPath + "<match>" + item.name + "</match>" + "  <dim>" + item.desc + "</dim>";
    } else {
        return "";
    }
}
