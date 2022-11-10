const STATS_PATTERNS = [{
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
        pattern: /^[>%?]|(v?1\.).*/i,
    },
];
const WEEKS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function makeNumericKeyObject(start, end, initial = 0) {
    return Array.from({ length: end + 1 - start }).fill(initial)
        .reduce((obj, current, index) => {
            obj[start + index] = current;
            return obj;
        }, {});
}

class Statistics {
    constructor() {
        this.saveData = [];
        this.calendarData = Object.create(null)
        this.cratesData = Object.create(null)
        this.typeData = Object.create(null)
        this.weeksData = WEEKS.reduce((obj, week) => {
            obj[week] = 0;
            return obj;
        }, {});
        this.hoursData = makeNumericKeyObject(0, 23);
        this.datesData = makeNumericKeyObject(1, 31);
        this.total = 0;
    }

    /**
     * Load statistics data from local storage.
     */
    static async load() {
        let self = new Statistics();

        let stats = await storage.getItem("statistics");
        if (stats) {
            self.calendarData = stats.calendarData;
            // Generate weeks and dates data from calendar data.
            for (let [key, value] of Object.entries(stats.calendarData)) {
                let date = new Date(key);
                self.weeksData[WEEKS[date.getDay()]] += value;
                self.datesData[date.getDate()] += value;
            }
            self.cratesData = stats.cratesData;
            self.typeData = stats.typeData;
            self.hoursData = stats.hoursData;
            self.total = stats.total;
            self.saveData = stats.saveData || [];
        }
        return self;
    }

    /**
     * Save the statistics data to local storage.
     */
    async save() {
        for (let hour of Object.keys(this.hoursData)) {
            // Clean legacy dirty data.
            if (hour < 1 || hour > 23) {
                delete this.hoursData[hour];
            }
        }

        // Never serialize weeksData and datesData.
        await storage.setItem("statistics", {
            calendarData: this.calendarData,
            cratesData: this.cratesData,
            typeData: this.typeData,
            hoursData: this.hoursData,
            total: this.total,
            saveData: this.saveData,
        });
    }

    /**
     * Record search history item.
     *
     * @param the search history item
     * @param autoSave whether auto save the statistics result into local storage
     */
    async record({ query, content, description, time }, autoSave = false) {
        let date = new Date(time);
        this.hoursData[date.getHours()] += 1;

        const c = new Compat();
        let key = c.normalizeDate(date);
        this.calendarData[key] = (this.calendarData[key] || 0) + 1;

        const arr = [time, null, null]
        let searchType = Statistics.recordSearchType({ query, content, description });
        if (searchType) {
            this.typeData[searchType] = (this.typeData[searchType] || 0) + 1;
            arr[1] = searchType;
        }

        let crate = Statistics.recordSearchCrate(content);
        if (crate) {
            this.cratesData[crate] = (this.cratesData[crate] || 0) + 1;
            arr[2] = crate;
        }
        
        this.saveData.push(arr);

        this.total += 1;

        if (autoSave) {
            await this.save();
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