const history = JSON.parse(localStorage.getItem("history")) || [];
let chartColor = "rgba(249, 188, 45, 0.5)";
let weeks = {"Sun": 0, "Mon": 0, "Tue": 0, "Wed": 0, "Thu": 0, "Fri": 0, "Sat": 0};
let dates = makeNumericKeyObject(1, 31);
let hours = makeNumericKeyObject(0, 23);

function makeNumericKeyObject(start, end, initial = 0) {
    return Array.from({length: end + 1 - start}).fill(initial)
        .reduce((obj, current, index) => {
            obj[start + index] = current;
            return obj;
        }, {});
}

let stats = [
    {
        name: "stable",
        pattern: null,
        value: 0,
        color: "#FEC744",
        description: "Std stable docs searches."
    },
    {
        name: "nightly",
        pattern: /^\/.*/i,
        value: 0,
        color: "#030303",
        description: "Std nightly docs searches."
    },
    {
        name: "docs.rs",
        pattern: /^[~@].*/i,
        value: 0,
        color: "#dd6b33",
        description: "Docs.rs docs search.",
    },
    {
        name: "crates",
        // Remove pattern for crates search for history data compatibility,
        // since we switched the prefix priority between crates and docs.rs.
        pattern: null,
        value: 0,
        color: "#3D6739",
        description: "crates.io or lib.rs searches."
    },
    {
        name: "attributes",
        pattern: /^#.*/i,
        value: 0,
        color: "#9e78c6",
        description: "Built-in attributes searches."
    },
    {
        name: "error codes",
        pattern: /^`?e\d{2,4}`?$/i,
        value: 0,
        color: "#f50707",
        description: "Compile error index searches."
    },
    {
        name: "others",
        pattern: /^[>%?].*/i,
        value: 0,
        color: "#ededed",
        description: "Others including any Clippy lint (>), book (%), and caniuse/rfc (?) searches."
    },
];
let calendarData = [];
let topCratesData = {};

let w = Object.keys(weeks);
let d = Object.keys(dates);
let h = Object.keys(hours);

history.forEach(({query, content, description, time}) => {
    let date = new Date(time);
    calendarData.push({
        date,
        count: 1
    });
    weeks[w[date.getDay()]] += 1;
    dates[d[date.getDate() - 1]] += 1;
    hours[h[date.getHours()]] += 1;

    let stat = stats.find(item => item.pattern && item.pattern.test(query));
    if (stat) {
        stat.value += 1;
    } else {
        // Classify the default search cases
        if (content.startsWith("https://docs.rs")) {
            // Crate docs
            stats[2].value += 1;
        } else if (["https://crates.io", "https://lib.rs"].some(prefix => content.startsWith(prefix))) {
            // Crates
            stats[3].value += 1;
        } else if (description.startsWith("Attribute")) {
            // Attribute
            stats[4].value += 1;
        } else {
            // Std docs (stable)
            stats[0].value += 1;
        }
    }

    if (["https://docs.rs", "https://crates.io", "https://lib.rs"].some(prefix => content.startsWith(prefix))) {
        let url = new URL(content);
        // Starting with "search" is a valid form for a crate name. We should distinguish it from the crates.io search path.
        // E.g. https://crates.io/search?q=abc is the search URL, which should be excluded in the top crates data,
        // https://docs.rs/searchspot is a crate named "searchspot" URL, which should be included.
        if (!(url.pathname.startsWith("/search") && url.search)) {
            let pathname = url.pathname.replace("/crates/", "/").slice(1);
            let result = pathname.split("/");
            let crate;
            if (result.length >= 3) {
                // In this case, third element is the correct crate name.
                // e.g. https://docs.rs/~/*/async_std/stream/trait.Stream.html
                [_, __, crate] = result;
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
});

let [weeksData, datesData, hoursData] = [weeks, dates, hours].map(data => {
    return Object.entries(data).map(([key, value]) => {
        return {name: key, value}
    })
});

let heatmap = calendarHeatmap()
    .data(calendarData)
    .selector('.chart-heatmap')
    .tooltipEnabled(true)
    .colorRange([
        {min: 0, color: '#f4f7f7'},
        {min: 1, max: 2, color: '#ffdd2b'},
        {min: 3, max: 6, color: '#f6a405'},
        {min: 7, max: 11, color: '#f56b04'},
        {min: 12, max: 'Infinity', color: '#f40703'}
    ])
    .tooltipUnit([
        {min: 0, unit: 'search'},
        {min: 1, max: 1, unit: 'searches'},
        {min: 2, max: 'Infinity', unit: 'searches'}
    ])
    .legendEnabled(true)
    .onClick(function (data) {
        console.log('data', data);
    });
heatmap();

let histogramConfig = {
    width: 460,
    height: 240,
    color: chartColor,
    margin: {top: 30, right: 0, bottom: 40, left: 40}
};
histogram({
    selector: ".chart-histogram-week",
    data: weeksData,
    ...histogramConfig,
});

histogram({
    selector: ".chart-histogram-date",
    data: datesData,
    ...histogramConfig,
});

histogram({
    selector: ".chart-histogram-hour",
    data: hoursData,
    ...histogramConfig,
});

let searchTimes = document.querySelector(".search-time");
let frequency = searchTimes.querySelectorAll("b");
frequency[0].textContent = `${history.length}`;
frequency[1].textContent = calculateSavedTime(history.length);

function calculateSavedTime(times) {
    if (times * 5 > 3600) {
        return `${Math.round(times * 5 / 3600)} hours.`;
    } else if (times * 5 > 60) {
        return `${Math.round(times * 5 / 60)} minutes.`;
    } else {
        return `${Math.round(times * 5)} seconds.`;
    }
}

let searchStatsGraph = document.querySelector(".search-stats-graph");
let searchStatsText = document.querySelector(".search-stats-text");
let ol = searchStatsText.querySelector("ol");
stats.sort((a, b) => {
    // Others always the last
    if (a.name.toLowerCase() === "others" || b.name.toLowerCase() === "others") return 0;
    return b.value - a.value;
});
stats.forEach(({name, color, value, description}) => {
    let li = document.createElement("li");
    li.innerHTML = `<div aria-label="${description}" data-balloon-pos="up" data-balloon-length="large"
                        style="text-align: center" class="tooltip-color">
                        <span class="color-block" style="background-color:${color}"></span>
                        <span class="">${name}</span>
                        <span class="">${(value / history.length * 100).toFixed(1)}%</span>
                     </div>`;
    ol.append(li);
    if (value > 0) {
        searchStatsGraph.insertAdjacentHTML('beforeend', `<span class="show" style="width: ${value / history.length * 100}%;
                                                        background-color:${color}"></span>`);
    }
});

topCratesData = Object.entries(topCratesData).sort((a, b) => b[1] - a[1]).map(([key, value], index) => {
    return {
        label: `#${index + 1}`,
        name: key,
        value
    };
});
topCratesData.splice(15);
barChart({
    margin: ({top: 30, right: 0, bottom: 10, left: 30}),
    // Calculate height dynamically to keep the bar with consistence width regardless of the topCratesData length.
    height: 800 / 15 * topCratesData.length + 40,
    barHeight: 25,
    width: 460,
    data: topCratesData,
    selector: ".topCratesData",
    color: chartColor,
});