let history = JSON.parse(localStorage.getItem("history"));
let chartColor = "#F9BB2D";
let weeks = { "Sun": 0, "Mon": 0, "Tue": 0, "Wed": 0, "Thu": 0, "Fri": 0, "Sat": 0 };
let dates = makeNumericKeyObject(1, 31);
let hours = makeNumericKeyObject(0, 23);
function makeNumericKeyObject(start, end, initial = 0) {
    return Array.from({ length: end + 1 - start }).fill(initial)
        .reduce((obj, current, index) => {
            obj[start + index] = current;
            return obj;
        }, {});
};

let stats = [
    // { name: "Repository", prefix: "!!!", value: 0, color: "#f00" },
    { name: "Docs", prefix: "!!", value: 0, color: "#ff00af" },
    { name: "Crates", prefix: "!", value: 0, color: "#b600ff" },
    { name: "Book", prefix: "%", value: 0, color: "#3400ff" },
    { name: "Lint", prefix: ">", value: 0, color: "#0944ff" },
    { name: "Crate docs", prefix: "@", value: 0, color: "#00f2ff" },
    { name: "Attribute", prefix: "#", value: 0, color: "#00442d" },
    { name: "Std docs", prefix: "", value: 0, color: "#ffa600" },
];
let calendarData = [];
let topCratesData = {}; //bar-chart(url)

let w = Object.keys(weeks);
let d = Object.keys(dates);
let h = Object.keys(hours);

history.forEach(({ query, content, time }) => {
    let date = new Date(time);
    calendarData.push({
        date,
        count: 1
    });
    weeks[w[date.getDay()]] += 1;
    dates[d[date.getDate() - 1]] += 1;
    hours[h[date.getHours()]] += 1;

    //chart-heatmap
    let stat = stats.find(item => query.startsWith(item.prefix));
    if (stat) {
        stat.value += 1;
    }

    // bar-chart(url)
    if (["https://docs.rs", "https://crates.io", "https://lib.rs"].some(prefix => content.startsWith(prefix))) {
        let url = new URL(content);
        let pathname = url.pathname.replace("/crates/", "/").slice(1);
        let [crate, _] = pathname.split("/");
        if (topCratesData[crate]) {
            topCratesData[crate] += 1;
        } else {
            topCratesData[crate] = 1;
        }
    }
});

let [weeksData, datesData, hoursData] = [weeks, dates, hours].map(data => {
    return Object.entries(data).map(([key, value]) => { return { name: key, value } })
});

let heatmap = calendarHeatmap()
    .data(calendarData)
    .selector('.chart-heatmap')
    .tooltipEnabled(true)
    .colorRange(['#f4f7f7', chartColor])
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
    width: 550,
    height: 320,
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

let spans = document.querySelector(".searching-stats-graph");
let showText = document.querySelector(".showText");
let ol = showText.querySelector("ol");
function byField(key) {
    return function (a, b) {
        if (b[key] > a[key]) {
            return 1;
        } else {
            return -1;
        }
    }
}
let sum = stats.sort(byField("value")).reduce((item, { value }) => {
    return item + value
}, 0);

stats.forEach(({ name, color, value }) => {
    let li = document.createElement("li");
    li.innerHTML = `<span class="color-block" style="background-color:${color}"></span>
                            <span class="">${name}</span>
                            <span class="">${(value / sum * 100).toFixed(1)}%<span>`;
    ol.append(li);
    if (value > 0) {
        spans.insertAdjacentHTML('beforeend', `<span class="show" style="width: ${value / sum * 100}%;
                                                        background-color:${color}"></span>`);
    }
})

topCratesData = Object.entries(topCratesData).map(([key, value]) => {
    return {
        name: key,
        value
    };
});
topCratesData.sort(byField("value"));
topCratesData.splice(10);
barChart({
    margin: ({ top: 30, right: 0, bottom: 10, left: 30 }),
    height: 320,
    barHeight: 25,
    width: 750,
    data: topCratesData,
    selector: ".bar-chart",
    color: "#F9BB2D",
});