const history = JSON.parse(localStorage.getItem("history")) || [];
let chartColor = "rgba(249, 188, 45, 0.5)";
let weeks = { "Sun": 0, "Mon": 0, "Tue": 0, "Wed": 0, "Thu": 0, "Fri": 0, "Sat": 0 };
let dates = makeNumericKeyObject(1, 31);
let hours = makeNumericKeyObject(0, 23);
function makeNumericKeyObject(start, end, initial = 0) {
    return Array.from({ length: end + 1 - start }).fill(initial)
        .reduce((obj, current, index) => {
            obj[start + index] = current;
            return obj;
        }, {});
}

let stats = [
    {name: "Std docs", pattern: null,value: 0, color: "#ffa600"},
    {name: "External docs", pattern: /^[~@].*/i,value: 0, color: "#ff00af"},
    {name: "Crates", pattern: /^!.*/i,value: 0, color: "#b600ff"},
    {name: "Attribute", pattern: /^#.*/i,value: 0, color: "#00442d"},
    {name: "Error code", pattern: /e\d{2,4}$/i,value: 0, color: "#dd4814"},
    {name: "Others", pattern: /^[>%].*/i,value: 0, color: "#ededed"},
];
let calendarData = [];
let topCratesData = {};

let w = Object.keys(weeks);
let d = Object.keys(dates);
let h = Object.keys(hours);

history.forEach(({ query, content, description, time }) => {
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
        // Classify the default searching
        if (["https://crates.io", "https://lib.rs"].some(prefix => content.startsWith(prefix))) {
            // Crates
            stats[2].value += 1;
        } else if (description.startsWith("Attribute")) {
            // Attribute
            stats[3].value += 1;
        } else {
            // Std docs
            stats[0].value += 1;
        }
    }

    if (["https://docs.rs", "https://crates.io", "https://lib.rs"].some(prefix => content.startsWith(prefix))) {
        let url = new URL(content);
        let pathname = url.pathname.replace("/crates/", "/").slice(1);
        let [crate, _] = pathname.split("/");
        crate = crate.replace(/-/gi, "_");
        let counter = topCratesData[crate] || 0;
        topCratesData[crate] = counter + 1;
    }
});

let [weeksData, datesData, hoursData] = [weeks, dates, hours].map(data => {
    return Object.entries(data).map(([key, value]) => { return { name: key, value } })
});

let heatmap = calendarHeatmap()
    .data(calendarData)
    .selector('.chart-heatmap')
    .tooltipEnabled(true)
    .colorRange(['#f4f7f7', '#F9BB2D'])
    .tooltipUnit([
        { min: 0, unit: 'searching' },
        { min: 1, max: 1, unit: 'searching' },
        { min: 2, max: 'Infinity', unit: 'searchings' }
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
    margin: { top: 30, right: 0, bottom: 40, left: 40 }
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

let searchingTimes = document.querySelector(".searching-time");
let frequency = searchingTimes.querySelectorAll("b");
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

let searchingStatsGraph = document.querySelector(".searching-stats-graph");
let searchingStatsText = document.querySelector(".searching-stats-text");
let ol = searchingStatsText.querySelector("ol");
stats.sort((a, b) => {
    // Others always the last
    if (a.name === "Others" || b.name === "Others") return 0;
    return b.value - a.value;
});
stats.forEach(({ name, color, value }) => {
    let li = document.createElement("li");
    li.innerHTML = `<span class="color-block" style="background-color:${color}"></span>
                            <span class="">${name}</span>
                            <span class="">${(value / history.length * 100).toFixed(1)}%<span>`;
    ol.append(li);
    if (value > 0) {
        searchingStatsGraph.insertAdjacentHTML('beforeend', `<span class="show" style="width: ${value / history.length * 100}%;
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
    margin: ({ top: 30, right: 0, bottom: 10, left: 30 }),
    // Calculate height dynamically to keep the bar with consistence width regardless of the topCratesData length.
    height: 800 / 15 * topCratesData.length + 40,
    barHeight: 25,
    width: 460,
    data: topCratesData,
    selector: ".topCratesData",
    color: chartColor,
});