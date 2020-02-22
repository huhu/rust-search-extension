function BookSearch(bookIndex) {
    this.pages = {};
    bookIndex.forEach(({name, url, pages}) => {
        pages.forEach(([title, path, parentTitles]) => {
            let cleanedTitle = cleanChapterTitle(title);
            if (!this.pages.hasOwnProperty(cleanedTitle)) {
                this.pages[cleanedTitle] = [];
            }
            this.pages[cleanedTitle].push({title, name, url: `${url}${path}.html`, parentTitles});
        });
    });
    this.titles = Object.keys(this.pages);
}

BookSearch.prototype.search = function(query) {
    query = query.replace(/[%\s]/ig, "").toLowerCase();
    let results = [];
    for (let title of this.titles) {
        if (title.length < query.length) continue;
        let index = title.indexOf(query);
        if (index > -1) {
            results.push({title, matchIndex: index});
        }
    }
    return results.sort((a, b) => a.title.length - b.title.length)
        .flatMap(item => {
            return this.pages[item.title];
        });
};

function cleanChapterTitle(title) {
    return title.toLowerCase().replace(/[0-9.]/g, "").trim();
}
