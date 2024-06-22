import { barChart, histogram, calendarHeatmap } from "./charts.js";
import { STATS_PATTERNS } from "../../statistics.js";
import Statistics from "../../statistics.js";
import { start } from "../../main.js";
import Omnibox from "../../core/omnibox.js";

const TYPE_OTHER = "other";
const CHART_COLOR = "rgba(249, 188, 45, 0.5)";
const STATS_MAP = {
    "stable": {
        color: "#FEC744",
        description: "Std stable docs searches."
    },
    "nightly": {
        color: "#030303",
        description: "Std nightly docs searches."
    },
    "docs.rs": {
        color: "#dd6b33",
        description: "Docs.rs docs search.",
    },
    "crate": {
        color: "#3D6739",
        description: "crates.io or lib.rs searches."
    },
    "attribute": {
        color: "#9e78c6",
        description: "Built-in attributes searches."
    },
    "error code": {
        color: "#f50707",
        description: "Compile error index searches."
    },
    [TYPE_OTHER]: {
        color: "#ededed",
        description: "Others including any Rust version, Clippy lint (>), book (%), and caniuse/rfc (?) searches."
    }
};
const STATS_NUMBER = STATS_PATTERNS.reduce((pre, current) => {
    pre[current.type] = current.name;
    return pre;
}, Object.create(null));
const WEEKS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function makeNumericKeyObject(start, end, initial = 0) {
    return Array.from({ length: end + 1 - start }).fill(initial)
        .reduce((obj, current, index) => {
            obj[start + index] = current;
            return obj;
        }, {});
}

const histogramConfig = {
    width: 460,
    height: 240,
    color: CHART_COLOR,
    margin: { top: 30, right: 0, bottom: 40, left: 40 },
};

function calculateSavedTime(times) {
    let seconds = times * 5;
    if (seconds > 3600) {
        let hours = seconds / 3600;
        let minutes = seconds % 3600 / 60;
        if (minutes > 0) {
            return `${Math.round(hours)} hours ${Math.round(minutes)} minutes`;
        } else {
            return `${Math.round(hours)} hours`;
        }
    } else if (seconds > 60) {
        return `${Math.round(seconds / 60)} minutes`;
    } else {
        return `${Math.round(seconds)} seconds`;
    }
}

function renderSearchTimes(length = 0, searchTime) {
    let searchTimes = document.querySelector(".search-time");
    let frequency = searchTimes.querySelectorAll("b");
    frequency[0].textContent = `${length}`;
    if (searchTime) {
        frequency[1].textContent = `${searchTime}`;
    }
    frequency[2].textContent = calculateSavedTime(length);
}

function renderHeatmap(data, now, yearAgo) {
    let heatmap = calendarHeatmap(now, yearAgo)
        .data(data)
        .selector('.chart-heatmap')
        .tooltipEnabled(true)
        .colorRange([
            { min: 0, color: '#f4f7f7' },
            { min: 1, max: 2, color: '#ffdd2b' },
            { min: 3, max: 6, color: '#f6a405' },
            { min: 7, max: 11, color: '#f56b04' },
            { min: 12, max: 'Infinity', color: '#f40703' }
        ])
        .tooltipUnit([
            { min: 0, unit: 'search' },
            { min: 1, max: 1, unit: 'searches' },
            { min: 2, max: 'Infinity', unit: 'searches' }
        ])
        .legendEnabled(true)
        .onClick(function (data) {
            console.log('data', data);
        });
    heatmap();
}

function renderHistogram(weeksObj, datesObj, hoursObj) {
    const [weeksData, datesData, hoursData] = [weeksObj, datesObj, hoursObj]
        .map(data => {
            return Object.entries(data).map(([key, value]) => {
                return { name: key, value };
            });
        });
    const weekContainer = document.querySelector(".chart-histogram-week");
    if (weekContainer.hasChildNodes()) {
        weekContainer.innerHTML = null;
    }
    histogram({
        selector: ".chart-histogram-week",
        data: weeksData,
        ...histogramConfig,
    });

    const dateContainer = document.querySelector(".chart-histogram-date");
    if (dateContainer.hasChildNodes()) {
        dateContainer.innerHTML = null;
    }
    histogram({
        selector: ".chart-histogram-date",
        data: datesData,
        ...histogramConfig,
    });

    const hourContainer = document.querySelector(".chart-histogram-hour");
    if (hourContainer.hasChildNodes()) {
        hourContainer.innerHTML = null;
    }
    histogram({
        selector: ".chart-histogram-hour",
        data: hoursData,
        ...histogramConfig,
    });
}

function renderSearchStats(typeDataObj, total) {
    let searchStatsGraph = document.querySelector(".search-stats-graph");
    if (searchStatsGraph.hasChildNodes()) {
        searchStatsGraph.innerHTML = null;
    }

    let searchStatsText = document.querySelector(".search-stats-text");
    let ol = searchStatsText.querySelector("ol");
    if (ol.hasChildNodes()) {
        ol.innerHTML = null;
    }
    // Generate default type data.
    let defaultTypeData = Object.create(null)
    Object.keys(STATS_MAP).forEach(name => {
        defaultTypeData[name] = 0;
    });

    // Merge default type data with statistic type data.
    let array = Object.entries(Object.assign(defaultTypeData, typeDataObj));

    // Split the other part from the others in order to
    // keep the other part always in the last order.
    [
        ...array.filter(([key]) => key !== TYPE_OTHER).sort((a, b) => b[1] - a[1]),
        ...array.filter(([key]) => key === TYPE_OTHER),
    ].forEach(([name, value]) => {
        let { color, description } = STATS_MAP[name];
        let li = document.createElement("li");
        let percent = total ? (value / total * 100).toFixed(1) : 0.0;
        li.innerHTML = `<div aria-label="${description}" data-balloon-pos="up" data-balloon-length="large"
                        style="text-align: center" class="tooltip-color">
                        <span class="color-circle-dot" style="background-color:${color}"></span>
                        <span class="">${name}</span>
                        <span class="">${percent}%</span>
                     </div>`;
        ol.append(li);
        if (value > 0) {
            searchStatsGraph.insertAdjacentHTML('beforeend',
                `<span class="percent-bar" style="width: ${percent}%; background-color:${color}"></span>`
            );
        }
    });
}

function renderTopCratesChart(topCratesObj) {
    const topCratesContainer = document.querySelector(".topCratesData");
    if (topCratesContainer.hasChildNodes()) {
        topCratesContainer.innerHTML = null;
    }
    const topCratesData = Object.entries(topCratesObj)
        .sort((a, b) => b[1] - a[1])
        .map(([key, value], index) => {
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
        color: CHART_COLOR,
    });
}


async function renderCharts(now, yearAgo, searchTime) {
    const { timeline } = await Statistics.load();

    const data = timeline.filter(([time]) => {
        return now >= time && time >= yearAgo;
    });

    const heatMapData = data.reduce((pre, [t]) => {
        const time = moment(t).format("YYYY-MM-DD");
        pre[time] = (pre[time] || 0) + 1;
        return pre;
    }, {});

    const weeksObj = WEEKS.reduce((obj, week) => {
        obj[week] = 0;
        return obj;
    }, {});
    const datesObj = makeNumericKeyObject(1, 31);
    const hoursObj = makeNumericKeyObject(1, 23);

    let typeTotal = 0;
    const typeDataObj = Object.create(null);

    const topCratesObj = Object.create(null);

    data.forEach(([t, content, type]) => {
        const time = moment(t);
        const hour = time.hour();

        weeksObj[WEEKS[time.weekday()]] += 1;
        datesObj[time.date()] += 1;
        if (hour !== 0) {
            hoursObj[hour] += 1;
        }
        if (content) {
            const typeName = STATS_NUMBER[content];
            typeDataObj[typeName] = (typeDataObj[typeName] || 0) + 1;
            typeTotal += 1;
        }
        if (type) {
            topCratesObj[type] = (topCratesObj[type] || 0) + 1;
        }
    });

    renderSearchTimes(data.length, searchTime);
    renderHeatmap(heatMapData, now, yearAgo);
    renderHistogram(weeksObj, datesObj, hoursObj)
    renderSearchStats(typeDataObj, typeTotal);
    renderTopCratesChart(topCratesObj);
}

async function renderYearList() {
    const y = new Date().getFullYear();
    const year = document.querySelector(".filter-list");

    const { timeline } = await Statistics.load();

    const min = timeline.reduce((pre, current) => {
        return Math.min(pre, current[0]);
    }, moment().valueOf());

    for (let i = y; i >= moment(min).year(); i--) {
        const li = document.createElement('li');
        li.innerText = i;
        if (i === y) {
            li.className = "selected";
        }
        year.append(li);
    }

    year.addEventListener('click', async function (e) {
        if (e.target.tagName === "LI") {
            year.childNodes.forEach(i => i.classList.remove("selected"));
            e.target.className = "selected";
            const time = moment(e.target.innerText);
            const now = time.endOf('year').valueOf();
            const yearAgo = time.startOf('year').valueOf();
            await renderCharts(now, yearAgo, moment(yearAgo).format('YYYY'));
        }
    });
}
(async () => {
    const now = moment().valueOf();
    const yearAgo = moment().startOf('day').subtract(1, 'year').valueOf();
    await renderCharts(now, yearAgo);
    await renderYearList();
})();
(async () => {
    let iconBase64 = "data:image/png;base64,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";
    await start(Omnibox.webpage({
        el: "#omnibox",
        icon: iconBase64,
        placeholder: `Search rust things instantly!`,
    }));
})();
