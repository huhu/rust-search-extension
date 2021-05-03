const WEEKS = { "Sun": 0, "Mon": 0, "Tue": 0, "Wed": 0, "Thu": 0, "Fri": 0, "Sat": 0 };
const DATES = makeNumericKeyObject(1, 31);
const HOURS = makeNumericKeyObject(0, 23);

const W = Object.keys(WEEKS);
const D = Object.keys(DATES);
const H = Object.keys(HOURS);

const STATS = [
    {
        name: "stable",
        pattern: null,
        value: 0,
    },
    {
        name: "nightly",
        pattern: /^\/[^/].*/i,
        value: 0,
    },
    {
        name: "docs.rs",
        pattern: /^[~@].*/i,
        value: 0,
    },
    {
        name: "crate",
        pattern: /^!!!.*/i,
        value: 0,
    },
    {
        name: "attribute",
        pattern: /^#.*/i,
        value: 0,
    },
    {
        name: "error code",
        pattern: /^`?e\d{2,4}`?$/i,
        value: 0,
    },
    {
        name: "rustc",
        pattern: /^\/\/.*/i,
        value: 0,
    },
    {
        name: 'other',
        pattern: /^[>%?]|(1\.).*/i,
        value: 0,
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
        this.topCratesData = {};
        this.percentData = {};
        this.weeksData = [];
        this.hoursData = [];
        this.datesData = [];
        this.total = 0;
    }

    /**
     * Record search history item.
     * 
     * @param the search history item
     */
    record({ query, content, description, time }) {
        let date = new Date(time);
        WEEKS[W[date.getDay()]] += 1;
        DATES[D[date.getDate() - 1]] += 1;
        HOURS[H[date.getHours()]] += 1;

        const c = new Compat();
        let key = c.normalizeDate(date);
        this.calendarData[key] = (this.calendarData[key] || 0) + 1;

        let searchType = Statistics.recordSearchType({ query, content, description });
        if (searchType) {
            this.percentData[searchType] = (this.percentData[searchType] || 0) + 1;
        }

        let crate = Statistics.recordSearchCrate(content);
        if (crate) {
            this.topCratesData[crate] = (this.topCratesData[crate] || 0) + 1;
        }

        this.total += 1;
    }

    /**
     * Record the search type from the search history.
     * @returns {string|*} return the search type result if matched, otherwise return null.
     */
    static recordSearchType({ query, content, description }) {
        let stat = STATS.find(item => item.pattern && item.pattern.test(query));
        if (stat) {
            return stat.name;
        } else {
            // Classify the default search cases
            if (content.startsWith("https://docs.rs")) {
                // Crate docs
                return STATS[2].name;
            } else if (["https://crates.io", "https://lib.rs"].some(prefix => content.startsWith(prefix))) {
                // Crates
                return STATS[3].name;
            } else if (description.startsWith("Attribute")) {
                // Attribute
                return STATS[4].name;
            } else {
                // Std docs (stable)
                return STATS[0].name;
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

    /**
     * Aggregate statistics.
     * @returns The Statistics result.
     */
    aggregate() {
        [this.weeksData, this.datesData, this.hoursData] = [WEEKS, DATES, HOURS].map(data => {
            return Object.entries(data).map(([key, value]) => {
                return { name: key, value }
            })
        });
        return this;
    }
}