setup();

function setup() {
    chrome.omnibox.setDefaultSuggestion({
        description: "Search Rust official docs or crates for <match>%s</match>"
    });

    chrome.omnibox.onInputChanged.addListener(function(query, suggestFn) {
        suggestFn([{content: query, description: 'Rust', deletable: false}]);
    });

    chrome.omnibox.onInputEntered.addListener(function(query) {
        navigateToUrl('https://crates.io/search?q=' + encodeURIComponent(query));
    });
}

function navigateToUrl(url) {
    chrome.tabs.getSelected(null, function(tab) {
        chrome.tabs.update(tab.id, {url: url});
    });
}