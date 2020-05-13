let history = JSON.parse(localStorage.getItem("history"));
let colorRange = "#F9BB2D";
let weeks = { "Sun": 0, "Mon": 0, "Tue": 0, "Wed": 0, "Thu": 0, "Fri": 0, "Sat": 0 };
let dates = num(1, 31);
let hours = num(0, 23);
let stats = [{ name: "docsss", value: 0, color: "#f00" }, { name: "docss", value: 0, color: "#ff00af" }, { name: "docs", value: 0, color: "#b600ff" }, { name: "%", value: 0, color: "#3400ff" }, { name: ">", value: 0, color: "#0944ff" }, { name: "@", value: 0, color: "#00f2ff" }, { name: "#", value: 0, color: "#00ff2d" }, { name: "text", value: 0, color: "#ffa600" }]
let calendarData = [];

let w = Object.keys(weeks);
let d = Object.keys(dates);
let h = Object.keys(hours);

history.forEach(({ time }) => {
    let date = new Date(time);
    calendarData.push({
        date,
        count: 1
    });
    weeks[w[date.getDay()]] += 1;
    dates[d[date.getDate() - 1]] += 1;
    hours[h[date.getHours()]] += 1;
});

let [weeksData, datesData, hoursData] = [weeks, dates, hours].map(data => {
    return Object.entries(data).map(([key, value]) => { return { name: key, value } })
});

history.forEach(({ query }) => {
    if (query.startsWith("!!!")) {
        stats[0].value += 1
    } else if (query.startsWith("!!")) {
        stats[1].value += 1
    } else if (query.startsWith("!")) {
        stats[2].value += 1
    } else if (query.startsWith("%")) {
        stats[3].value += 1
    } else if (query.startsWith(">")) {
        stats[4].value += 1
    } else if (query.startsWith("@")) {
        stats[5].value += 1
    } else if (query.startsWith("#")) {
        stats[6].value += 1
    } else {
        stats[7].value += 1
    }
})

let heatmap = calendarHeatmap()
    .data(calendarData)
    .selector('.chart-heatmap')
    .tooltipEnabled(true)
    .colorRange(['#f4f7f7', colorRange])
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


function num(start, end) {
    let obj = {};
    for (let i = start; i <= end; i++) {
        obj[i] = 0;
    }
    return obj;
};

histogram({
    selector: ".chart-histogram-week",
    data: weeksData,
    width: 550,
    height: 320,
    color: "#F9BB2D",
    margin: { top: 30, right: 0, bottom: 40, left: 40 },
});

histogram({
    selector: ".chart-histogram-date",
    data: datesData,
    width: 550,
    height: 320,
    color: "#F9BB2D",
    margin: { top: 30, right: 0, bottom: 40, left: 40 },
});

histogram({
    selector: ".chart-histogram-hour",
    data: hoursData,
    width: 550,
    height: 320,
    color: "#F9BB2D",
    margin: { top: 30, right: 0, bottom: 40, left: 40 },
});


let spans = document.querySelector(".lang-stats-graph");
let showText = document.querySelector(".showText");
let lang = showText.querySelectorAll(".lang");
let percent = showText.querySelectorAll(".percent");
let colorBlock = showText.querySelectorAll(".color-block")
function byField(key) {
    return function (a, b) {
        if (b[key] > a[key]) {
            return 1;
        } else {
            return -1;
        }
    }
}
let sort = stats.sort(byField("value"))

let sum = sort.reduce((item, { value }) => {
    return item + value
}, 0)

for (let i = 0; i < sort.length; i++) {
    lang[i].textContent = `${sort[i].name}`;
    percent[i].textContent = `${(sort[i].value / sum * 100).toFixed(1)} %`;
    colorBlock[i].style.backgroundColor = `${sort[i].color}`;

    if (sort[i].value == 0) {
        null;
    } else {
        let p = document.createElement("span");
        p.style.width = `${sort[i].value / sum * 100}` + "%";
        p.style.backgroundColor = `${sort[i].color}`;
        p.classList = "show";
        spans.append(p);
    }
}


let datar = {};
history.forEach(({content}) => {
    if (["https://docs.rs", "https://crates.io","https://lib.rs"].some(prefix => content.startsWith(prefix))){
        let url = new URL(content);
        let pathname = url.pathname.replace("/crates/", "/").slice(1);
        let [crate, __] = pathname.split("/");
        if(datar[crate]) {
            datar[crate] += 1;
        } else {
            datar[crate] = 1;
        }
    }
})

let arr = [];
for(let i in datar) {
    arr.push({
        name: i,
        value: `${datar[i]}`
    })
}

let datat = arr.sort(byField("value"));
datat.splice(10);
datat[0].value = 16;

barChart({
    margin: ({ top: 30, right: 0, bottom: 10, left: 30 }),
    height: 320,
    barHeight: 25,
    width: 750,
    data: datat,
    selector: ".bar-chart",
    color: "#F9BB2D",
})