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

const stats = new Statistics().transform();
const total = stats.total;

let heatmap = calendarHeatmap()
    .data(stats.calendarData)
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

let histogramConfig = {
    width: 460,
    height: 240,
    color: CHART_COLOR,
    margin: { top: 30, right: 0, bottom: 40, left: 40 }
};
histogram({
    selector: ".chart-histogram-week",
    data: stats.weeksData,
    ...histogramConfig,
});

histogram({
    selector: ".chart-histogram-date",
    data: stats.datesData,
    ...histogramConfig,
});

histogram({
    selector: ".chart-histogram-hour",
    data: stats.hoursData,
    ...histogramConfig,
});

let searchTimes = document.querySelector(".search-time");
let frequency = searchTimes.querySelectorAll("b");
frequency[0].textContent = `${total}`;
frequency[1].textContent = calculateSavedTime(total);

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

let searchStatsGraph = document.querySelector(".search-stats-graph");
let searchStatsText = document.querySelector(".search-stats-text");
let ol = searchStatsText.querySelector("ol");

let array = Object.entries(stats.percentData);
// Split the other part from the others in order to
// keep the other part always in the last order.
[
    ...array.filter(([key, value]) => key !== TYPE_OTHER)
        .sort((a, b) => b[1] - a[1]),
    // Other part always the last.
    ...array.filter(([key, value]) => key === TYPE_OTHER),
].forEach(([name, value]) => {
    let { color, description } = STATS_MAP[name];
    let li = document.createElement("li");
    li.innerHTML = `<div aria-label="${description}" data-balloon-pos="up" data-balloon-length="large"
                        style="text-align: center" class="tooltip-color">
                        <span class="color-block" style="background-color:${color}"></span>
                        <span class="">${name}</span>
                        <span class="">${(value / total * 100).toFixed(1)}%</span>
                     </div>`;
    ol.append(li);
    if (value > 0) {
        searchStatsGraph.insertAdjacentHTML('beforeend',
            `<span class="show" style="width: ${value / total * 100}%; background-color:${color}"></span>`
        );
    }
});

let topCratesData = Object.entries(stats.topCratesData)
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