let calendarData = [];
let weeks = { "Sun": 0, "Mon": 0, "Tue": 0, "Wed": 0, "Thu": 0, "Fri": 0, "Sat": 0 };
let dates = num(1, 31);
let hours = num(0, 23);

let w = Object.keys(weeks);
let d = Object.keys(dates);
let h = Object.keys(hours);

const history = JSON.parse(localStorage.getItem("history"));
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