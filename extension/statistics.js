import storage from "./core/storage.js";

export const STATS_PATTERNS = [{
    name: "stable",
    pattern: null,
    type: 1,
},
{
    name: "nightly",
    pattern: /^\/[^/].*/i,
    type: 2,
},
{
    name: "docs.rs",
    pattern: /^[~@].*/i,
    type: 3,
},
{
    name: "crate",
    pattern: /^!!!.*/i,
    type: 4,
},
{
    name: "attribute",
    pattern: /^#.*/i,
    type: 5,
},
{
    name: "error code",
    pattern: /^`?e\d{2,4}`?$/i,
    type: 6,
},
{
    name: "other",
    pattern: /^[>%?]|(v?1\.).*/i,
    type: 999,
},
];

export default class Statistics {
    constructor() {
        // The timeline data of user searching history.
        // Consist of array of [timestamp, search type, option search crate].
        this.timeline = [];
    }

    /**
     * Load statistics data from local storage.
     */
    static async load() {
        let self = new Statistics();

        let stats = await storage.getItem("statistics");
        if (stats) {
            self.timeline = stats.timeline || [];
        }
        return self;
    }

    /**
     * Save the statistics data to local storage.
     */
    async save() {
        // Never serialize weeksData and datesData.
        await storage.setItem("statistics", {
            timeline: this.timeline,
        });
    }

    /**
     * Record search history item.
     *
     * @param the search history item
     * @param autoSave whether auto save the statistics result into local storage
     */
    async record({ query, content, description, time }, autoSave = false) {
        const arr = [time, null, null];
        let { type } = Statistics.parseSearchType({ query, content, description });
        if (type) {
            arr[1] = type;
        }

        let crate = Statistics.parseSearchCrate(content);
        if (crate) {
            arr[2] = crate;
        }

        this.timeline.push(arr);

        if (autoSave) {
            await this.save();
        }
    }

    /**
     * Record the search type from the search history.
     * @returns {string|*} return the search type result if matched, otherwise return null.
     */
    static parseSearchType({ query, content, description }) {
        let stat = STATS_PATTERNS.find(item => item.pattern?.test(query));
        if (stat) {
            return stat;
        } else {
            // Classify the default search cases
            if (content.startsWith("https://docs.rs")) {
                // Crate docs
                return STATS_PATTERNS[2];
            } else if (["https://crates.io", "https://lib.rs"].some(prefix => content.startsWith(prefix))) {
                // Crates
                return STATS_PATTERNS[3];
            } else if (description.startsWith("Attribute")) {
                // Attribute
                return STATS_PATTERNS[4];
            } else {
                // Std docs (stable)
                return STATS_PATTERNS[0];
            }
        }
    }

    /**
     * Record the searched crate from the content.
     * @returns {string|null}
     */
    static parseSearchCrate(content) {
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
