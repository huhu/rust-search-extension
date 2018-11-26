setup();

function setup() {
    chrome.omnibox.setDefaultSuggestion({
        description: "Search Rust docs for <match>%s</match> on https://doc.rust-lang.org"
    });

    chrome.omnibox.onInputChanged.addListener(function(query, suggestFn) {
        if (!query) return;

        var searchResults = window.search(query);
        var suggestResults = [];
        for (var i = 0; i < searchResults.length; i++) {
            var result = searchResults[i];
            suggestResults.push(buildSuggestResultItem(result));
        }

        if (suggestResults.length <= 4) {
            suggestResults.push({
                content: "https://crates.io/search?q=" + encodeURIComponent(query),
                description: "Search Rust crates for <match>" + query + "</match> on https://crates.io"
            })
        }

        suggestFn(suggestResults);
    });

    chrome.omnibox.onInputEntered.addListener(function(text) {
        if (text && text.startsWith(window.rootPath)
            || text.startsWith("https://crates.io")) {
            navigateToUrl(text);
        } else {
            navigateToUrl('https://doc.rust-lang.org/stable/std/?search=' + encodeURIComponent(text));
        }
    });
}


function navigateToUrl(url) {
    function nullOrDefault(value, defaultValue) {
        return value === null ? defaultValue : value;
    }

    var openType = nullOrDefault(localStorage.getItem("open-type"), "current-tab");
    if (openType === "current-tab") {
        chrome.tabs.getSelected(null, function(tab) {
            chrome.tabs.update(tab.id, {url: url});
        });
    } else {
        chrome.tabs.create({url: url});
    }
}

// Escape the five predefined entities to display them as text.
function escape(text) {
    text = text || "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function buildSuggestResultItem(item) {
    var description = item.displayPath + "<match>" + item.name + "</match>";
    if (item.desc) {
        description += " - <dim>" + escape(item.desc) + "</dim>";
    }
    return {
        content: item.href,
        description: description,
    }
}
