function BookSearch(bookIndex) {
    this.chapters = {};
    bookIndex.forEach(({name, url, chapters}) => {
        chapters.forEach(([title, path]) => {
            let cleanedTitle = cleanChapterTitle(title);
            if (!this.chapters.hasOwnProperty(cleanedTitle)) {
                this.chapters[cleanedTitle] = [];
            }
            this.chapters[cleanedTitle].push({title, name, url: `${url}${path}.html`});
        });
    });
    this.chapterTitles = Object.keys(this.chapters);
}

BookSearch.prototype.search = function(query) {
    query = query.replace(/[%\s]/ig, "").toLowerCase();
    let results = [];
    for (let title of this.chapterTitles) {
        if (title.length < query.length) continue;
        let index = title.indexOf(query);
        if (index > -1) {
            results.push({title, matchIndex: index});
        }
    }
    return results.sort((a, b) => a.title.length - b.title.length)
        .flatMap(item => {
            return this.chapters[item.title];
        });
};

function cleanChapterTitle(title) {
    return title.toLowerCase().replace(/[0-9.]/g, "").trim();
}
