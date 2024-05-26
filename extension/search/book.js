export default class BookSearch {
    constructor(bookIndex) {
        // Create a empyt object with null prototype.
        // This can prevent some weired bug, such as the key called `constructor`, 
        // this would conflict with the prototype constructor method!
        this.pages = Object.create(null);
        bookIndex.forEach(({ name, url, pages }) => {
            pages.forEach(([title, path, parentTitles]) => {
                let cleanedTitle = cleanChapterTitle(title);
                if (!(cleanedTitle in this.pages)) {
                    this.pages[cleanedTitle] = [];
                }
                this.pages[cleanedTitle].push({ title, name, url: `${url}${path}.html`, parentTitles });
            });
        });
        this.titles = Object.keys(this.pages);
    }

    search(query) {
        query = query.replace(/[%\s]/ig, "").toLowerCase();
        let results = [];
        for (let title of this.titles) {
            if (title.length < query.length) continue;
            let index = title.indexOf(query);
            if (index > -1) {
                results.push({ title, matchIndex: index });
            }
        }
        return results.sort((a, b) => a.title.length - b.title.length)
            .flatMap(item => {
                return this.pages[item.title];
            });
    }
};

function cleanChapterTitle(title) {
    return title.toLowerCase().replace(/[0-9.]/g, "").trim();
}
