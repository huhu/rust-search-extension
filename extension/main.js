
setup();

function setup() {
    chrome.omnibox.setDefaultSuggestion({
        description: "Search Rust official docs or crates for <match>%s</match>"
    });

    chrome.omnibox.onInputChanged.addListener(function(query, suggestFn) {
        console.log('suggest:', query);

        suggestFn([
            {
                content: "https://doc.rust-lang.org/stable/std/?search=" + query,
                description: "Docs - <dim>std::</dim>" + "<match>" + query + "</match>"
            },
        ]);
    });

    chrome.omnibox.onInputEntered.addListener(function(text) {
        if (text.match(/^https?\:/)) {
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