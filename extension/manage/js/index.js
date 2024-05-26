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
    "rustc": {
        color: "#0995cf",
        description: "Rustc docs searches."
    },
    [TYPE_OTHER]: {
        color: "#ededed",
        description: "Others including any Rust version, Clippy lint (>), book (%), and caniuse/rfc (?) searches."
    }
};

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
