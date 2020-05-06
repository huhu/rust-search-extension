let now = moment().endOf('day').toDate();
let yearAgo = moment().startOf('day').subtract(1, 'year').toDate();


let chartData = [];
let history = JSON.parse(localStorage.getItem("history"));
history.forEach(element => {
    chartData.push({
        date: new Date(element.time),
        count: 1
    })
});

let heatmap = calendarHeatmap()
    .data(chartData)
    .selector('.chart-heatmap')
    .tooltipEnabled(true)
    .colorRange(['#f4f7f7','#F9BB2D'])
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