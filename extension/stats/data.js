const WEEKS = {"Sun": 0, "Mon": 0, "Tue": 0, "Wed": 0, "Thu": 0, "Fri": 0, "Sat": 0};
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
    return Array.from({length: end + 1 - start}).fill(initial)
        .reduce((obj, current, index) => {
            obj[start + index] = current;
            return obj;
        }, {});
}

class LegacyStatistics {
    static statistic() {
        const c = new Compat();
        let calendarData = {};
        let topCratesData = {};

        const history = JSON.parse(localStorage.getItem("history")) || [];
        history.forEach(({query, content, description, time}) => {
            let date = new Date(time);
            let key = c.normalizeDate(date);
            calendarData[key] = (calendarData[key] || 0) + 1;

            let stat = STATS.find(item => item.pattern && item.pattern.test(query));
            if (stat) {
                stat.value += 1;
            } else {
                // Classify the default search cases
                if (content.startsWith("https://docs.rs")) {
                    // Crate docs
                    STATS[2].value += 1;
                } else if (["https://crates.io", "https://lib.rs"].some(prefix => content.startsWith(prefix))) {
                    // Crates
                    STATS[3].value += 1;
                } else if (description.startsWith("Attribute")) {
                    // Attribute
                    STATS[4].value += 1;
                } else {
                    // Std docs (stable)
                    STATS[0].value += 1;
                }
            }

            if (["https://docs.rs", "https://crates.io", "https://lib.rs"].some(prefix => content.startsWith(prefix))) {
                let url = new URL(content);
                if (url.search && (url.pathname.startsWith("/search") || url.pathname.startsWith("/releases/"))) {
                    // Ignore following cases:
                    // 1. https://docs.rs/releases/search?query=
                    // 2. https://crates.io/search?q=
                    // 3. https://lib.rs/search?q=
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
                    let counter = topCratesData[crate] || 0;
                    topCratesData[crate] = counter + 1;
                }
            } else if (["chrome-extension", "moz-extension"].some(prefix => content.startsWith(prefix))) {
                // This is the repository redirection case
                let url = new URL(content);
                let search = url.search.replace("?crate=", "");
                let crate = search.replace(/-/gi, "_");
                let counter = topCratesData[crate] || 0;
                topCratesData[crate] = counter + 1;
            }

            WEEKS[W[date.getDay()]] += 1;
            DATES[D[date.getDate() - 1]] += 1;
            HOURS[H[date.getHours()]] += 1;
        });

        // Eliminate 'pattern' field.
        let percentData = STATS.map(({name, value}) => {
            return {name, value};
        });

        let [weeksData, datesData, hoursData] = [WEEKS, DATES, HOURS].map(data => {
            return Object.entries(data).map(([key, value]) => {
                return {name: key, value}
            })
        });

        return {
            percentData,
            calendarData,
            topCratesData,
            weeksData,
            hoursData,
            datesData,
            total: history.length
        };
    }
}