const STATS_PATTERNS = [
    {
        name: "stable",
        pattern: null,
    },
    {
        name: "nightly",
        pattern: /^\/[^/].*/i,
    },
    {
        name: "docs.rs",
        pattern: /^[~@].*/i,
    },
    {
        name: "crate",
        pattern: /^!!!.*/i,
    },
    {
        name: "attribute",
        pattern: /^#.*/i,
    },
    {
        name: "error code",
        pattern: /^`?e\d{2,4}`?$/i,
    },
    {
        name: "rustc",
        pattern: /^\/\/.*/i,
    },
    {
        name: 'other',
        pattern: /^[>%?]|(1\.).*/i,
    },
];

function makeNumericKeyObject(start, end, initial = 0) {
    return Array.from({ length: end + 1 - start }).fill(initial)
        .reduce((obj, current, index) => {
            obj[start + index] = current;
            return obj;
        }, {});
}

class Statistics {
    constructor() {
        this.calendarData = {};
        this.cratesData = {};
        this.typeData = {};
        this.weeksData = { "Sun": 0, "Mon": 0, "Tue": 0, "Wed": 0, "Thu": 0, "Fri": 0, "Sat": 0 };
        this.hoursData = makeNumericKeyObject(1, 31);
        this.datesData = makeNumericKeyObject(0, 23);
        this.total = 0;

        this.load();
    }

    /**
     * Load statistics data from local storage.
     */
    load() {
        let self = JSON.parse(localStorage.getItem("statistics"));
        if (self) {
            this.calendarData = self.calendarData;
            this.cratesData = self.cratesData;
            this.typeData = self.typeData;
            this.weeksData = self.weeksData;
            this.hoursData = self.hoursData;
            this.datesData = self.datesData;
            this.total = self.total;
        }
    }

    /**
     * Save the statistics data to local storage.
     */
    save() {
        localStorage.setItem("statistics", JSON.stringify(this));
    }

    /**
     * Record search history item.
     * 
     * @param the search history item
     * @param autoSave whether auto save the statistics result into local storage
     */
    record({ query, content, description, time }, autoSave = false) {
        let date = new Date(time);
        this.weeksData[Object.keys(this.weeksData)[date.getDay()]] += 1;
        this.datesData[date.getDate() - 1] += 1;
        this.hoursData[date.getHours()] += 1;

        const c = new Compat();
        let key = c.normalizeDate(date);
        this.calendarData[key] = (this.calendarData[key] || 0) + 1;

        let searchType = Statistics.recordSearchType({ query, content, description });
        if (searchType) {
            this.typeData[searchType] = (this.typeData[searchType] || 0) + 1;
        }

        let crate = Statistics.recordSearchCrate(content);
        if (crate) {
            this.cratesData[crate] = (this.cratesData[crate] || 0) + 1;
        }

        this.total += 1;

        if (autoSave) {
            this.save();
        }
    }

    /**
     * Record the search type from the search history.
     * @returns {string|*} return the search type result if matched, otherwise return null.
     */
    static recordSearchType({ query, content, description }) {
        let stat = STATS_PATTERNS.find(item => item.pattern && item.pattern.test(query));
        if (stat) {
            return stat.name;
        } else {
            // Classify the default search cases
            if (content.startsWith("https://docs.rs")) {
                // Crate docs
                return STATS_PATTERNS[2].name;
            } else if (["https://crates.io", "https://lib.rs"].some(prefix => content.startsWith(prefix))) {
                // Crates
                return STATS_PATTERNS[3].name;
            } else if (description.startsWith("Attribute")) {
                // Attribute
                return STATS_PATTERNS[4].name;
            } else {
                // Std docs (stable)
                return STATS_PATTERNS[0].name;
            }
        }
    }

    /**
     * Record the searched crate from the content.
     * @returns {string|null}
     */
    static recordSearchCrate(content) {
        if (["https://docs.rs", "https://crates.io", "https://lib.rs"].some(prefix => content.startsWith(prefix))) {
            let url = new URL(content);
            if (url.search && (url.pathname.startsWith("/search") || url.pathname.startsWith("/releases/"))) {
                // Ignore following cases:
                // 1. https://docs.rs/releases/search?query=
                // 2. https://crates.io/search?q=
                // 3. https://lib.rs/search?q=
                return null;
            } else {
                // Following cases should be included:
                // - https://docs.rs/searchspot
                let pathname = url.pathname.replace("/crates/", "/").slice(1);
                let result = pathname.split("/");
                let crate;
                if (result.length >= 3) {
                    // In this case, third element is the correct crate name.
                    // e.g. https://docs.rs/~/*/async_std/stream/trait.Stream.html
                    crate = result[2];
                } else {
                    // In this case, the first element is the correct crate name.
                    // e.g. https://crates.io/crates/async_std
                    [crate] = result;
                }
                crate = crate.replace(/-/gi, "_");
                return crate;
            }
        } else if (["chrome-extension", "moz-extension"].some(prefix => content.startsWith(prefix))) {
            // This is the repository redirection case
            let url = new URL(content);
            let search = url.search.replace("?crate=", "");
            return search.replace(/-/gi, "_");
        }
    }
}