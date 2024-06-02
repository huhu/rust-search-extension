
function histogram({ selector, width, height, data, color, margin }) {
    let tooltip;
    let yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(Math.min(10, d3.max(data, d => d.value))))
        .call(g => g.append("text")
            .attr("x", -margin.left)
            .attr("y", 10)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            // .text("Times")
        )
        .attr('font-size', 11);
    let xAxis = g => g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(i => data[i].name).tickSizeOuter(0))
        .attr('font-size', 11);
    let y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value)]).nice()
        .range([height - margin.bottom, margin.top]);
    let x = d3.scaleBand()
        .domain(d3.range(data.length))
        .range([margin.left, width - margin.right])
        .padding(0.1);

    const svg = d3.select(selector)
        .append("svg")
        .attr("width", width)
        .attr("height", height);
    svg.append("g")
        .attr("fill", color)
        .selectAll("rect")
        .data(data)
        .join("rect")
        .attr("x", (d, i) => x(i) + x.bandwidth() / 4)
        .attr("y", d => y(d.value))
        .attr("height", d => y(0) - y(d.value))
        .attr("width", x.bandwidth() / 2)
        .on('mouseover', function (d, i) {
            let tooltipWidth = 36;
            tooltip = d3.select(selector)
                .append('div')
                .attr('class', 'histogram-bar-tooltip')
                .html(`<span>${d.value}</span>`)
                .style('width', `${tooltipWidth}px`)
                .style('left', () => {
                    return x(i) + x.bandwidth() / 2 - tooltipWidth / 2 + "px";
                })
                .style('top', () => y(d.value) - 30 + "px")
        })
        .on("mouseout", function (d, i) {
            tooltip.remove();
        });

    svg.append("g")
        .call(xAxis);

    svg.append("g")
        .call(yAxis);

}

function barChart({ margin, height, width, data, selector, color, }) {
    let tooltip;

    let yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).tickFormat(i => data[i].label).tickSizeOuter(0))
        .attr('font-size', 14);

    let xAxis = g => g
        .attr("transform", `translate(0,${margin.top})`)
        .call(d3.axisTop(x).ticks(Math.min(10, d3.max(data, d => d.value))))
        .call(g => g.select(".domain"))
        .attr('font-size', 14);

    let y = d3.scaleBand()
        .domain(d3.range(data.length))
        .rangeRound([margin.top, height - margin.bottom])
        .padding(0.2);

    let x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value)])
        .range([margin.left, width - margin.right])

    const svg = d3.select(selector)
        .append("svg")
        .attr("width", width)
        .attr("height", height);
    // .attr("viewBox", [0, 0, width, height]);

    svg.append("g")
        .attr("fill", color)
        .selectAll("rect")
        .data(data)
        .join("rect")
        .attr("x", x(0))
        .attr("y", (d, i) => y(i) + y.bandwidth() / 4)
        .attr("width", d => x(d.value) - x(0))
        .attr("height", y.bandwidth() / 2)
        .on('mouseover', function (d, i) {
            let tooltipWidth = 36;
            tooltip = d3.select(selector)
                .append('div')
                .attr('class', 'histogram-bar-tooltip')
                .html(`<span>${d.value}</span>`)
                .style('width', `${tooltipWidth}px`)
                .style('left', x(d.value) + 5 + "px")
                .style('top', y(i) + y.bandwidth() / 2 - tooltipWidth / 3 + "px")
        })
        .on("mouseout", function (d, i) {
            tooltip.remove();
        });

    svg.append("g")
        .attr("fill", "black")
        .attr("text-anchor", "start")
        .attr("font-family", "sans-serif")
        .attr("font-size", 14)
        .selectAll("text")
        .data(data)
        .join("text")
        .attr("x", d => x(0) + 5)
        .attr("y", (d, i) => y(i))
        .attr("dy", "0.35em")
        .text(d => d.name);

    svg.append("g")
        .call(xAxis);

    svg.append("g")
        .call(yAxis);

}

function calendarHeatmap(start, end) {
    // defaults
    const width = 800;
    const height = 150;
    const legendWidth = 110;
    let selector = 'body';
    const SQUARE_LENGTH = 12;
    const SQUARE_PADDING = 3;
    const MONTH_LABEL_PADDING = 6;
    let now = moment(start).toDate();
    let yearAgo = moment(end).toDate();
    let counterMap = Object.create(null)
    let colorRange = [];
    let tooltipEnabled = true;
    let tooltipUnit = 'contribution';
    let legendEnabled = true;
    let onClick = null;
    const weekStart = 0; //0 for Sunday, 1 for Monday
    let locale = {
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        days: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
        No: 'No',
        on: 'on',
        Less: 'Less',
        More: 'More'
    };
    const v = Number(d3.version.split('.')[0]);

    // setters and getters
    chart.data = function (value) {
        if (!arguments.length) {
            return counterMap;
        }
        counterMap = value;
        return chart;
    };

    chart.selector = function (value) {
        if (!arguments.length) {
            return selector;
        }
        selector = value;
        return chart;
    };

    chart.colorRange = function (value) {
        if (!arguments.length) {
            return colorRange;
        }
        colorRange = value;
        return chart;
    };

    chart.tooltipEnabled = function (value) {
        if (!arguments.length) {
            return tooltipEnabled;
        }
        tooltipEnabled = value;
        return chart;
    };

    chart.tooltipUnit = function (value) {
        if (!arguments.length) {
            return tooltipUnit;
        }
        tooltipUnit = value;
        return chart;
    };

    chart.legendEnabled = function (value) {
        if (!arguments.length) {
            return legendEnabled;
        }
        legendEnabled = value;
        return chart;
    };

    chart.onClick = function (value) {
        if (!arguments.length) {
            return onClick();
        }
        onClick = value;
        return chart;
    };

    function chart() {

        d3.select(chart.selector()).selectAll('svg.calendar-heatmap').remove(); // remove the existing chart, if it exists

        const dateRange = ((d3.time && d3.time.days) || d3.timeDays)(yearAgo, now); // generates an array of date objects within the specified range
        let monthRange = ((d3.time && d3.time.months) || d3.timeMonths)(moment(yearAgo).startOf('month').toDate(), now); // it ignores the first month if the 1st date is after the start of the month
        if (now.getDate() >= 23) {
            monthRange = monthRange.slice(-12);
        } else {
            monthRange = monthRange.slice(0, 12);
        }
        const firstDate = moment(dateRange[0]);
        let color = function (value) {
            for (let i in colorRange) {
                let item = colorRange[i]
                let _max = item.max || item.min;
                _max = item.max === 'Infinity' ? Infinity : _max;
                if (item.min <= value && value <= _max) {
                    return item.color;
                }
            }
        }

        let tooltip;
        let dayRects;

        drawChart();

        function drawChart() {
            const svg = d3.select(chart.selector())
                .style('position', 'relative')
                .append('svg')
                .attr('width', width)
                .attr('class', 'calendar-heatmap')
                .attr('height', height)
                .style('padding', '36px');

            dayRects = svg.selectAll('.day-cell')
                .data(dateRange);  //  array of days for the last yr

            const enterSelection = dayRects.enter().append('rect')
                .attr('class', 'day-cell')
                .attr('width', SQUARE_LENGTH)
                .attr('height', SQUARE_LENGTH)
                .attr('fill', function (d) {
                    return color(countForDate(d));
                })
                .attr('x', function (d, i) {
                    const cellDate = moment(d);
                    const result = cellDate.week() - firstDate.week() + (firstDate.weeksInYear() * (cellDate.weekYear() - firstDate.weekYear()));
                    return result * (SQUARE_LENGTH + SQUARE_PADDING);
                })
                .attr('y', function (d, i) {
                    return MONTH_LABEL_PADDING + formatWeekday(d.getDay()) * (SQUARE_LENGTH + SQUARE_PADDING);
                });

            if (typeof onClick === 'function') {
                (v === 3 ? enterSelection : enterSelection.merge(dayRects)).on('click', function (d) {
                    const count = countForDate(d);
                    onClick({ date: d, count: count });
                });
            }

            if (chart.tooltipEnabled()) {
                (v === 3 ? enterSelection : enterSelection.merge(dayRects)).on('mouseover', function (d, i) {
                    tooltip = d3.select(chart.selector())
                        .append('div')
                        .attr('class', 'day-cell-tooltip')
                        .html(tooltipHTMLForDate(d))
                        .style('left', function () {
                            return Math.floor(i / 7) * SQUARE_LENGTH + 'px';
                        })
                        .style('top', function () {
                            return formatWeekday(d.getDay()) * (SQUARE_LENGTH + SQUARE_PADDING) + MONTH_LABEL_PADDING * 2 + 'px';
                        });
                })
                    .on('mouseout', function (d, i) {
                        tooltip.remove();
                    });
            }

            if (chart.legendEnabled()) {
                const legendGroup = svg.append('g');
                legendGroup.selectAll('.calendar-heatmap-legend')
                    .data(colorRange)
                    .enter()
                    .append('rect')
                    .attr('class', 'calendar-heatmap-legend')
                    .attr('width', SQUARE_LENGTH)
                    .attr('height', SQUARE_LENGTH)
                    .attr('x', function (d, i) {
                        return (width - legendWidth) + (i + 1) * (SQUARE_LENGTH + SQUARE_PADDING);
                    })
                    .attr('y', height - 30 + SQUARE_PADDING)
                    .attr('fill', function (d, i) {
                        return colorRange[i].color;
                    });

                legendGroup.append('text')
                    .attr('class', 'calendar-heatmap-legend-text calendar-heatmap-legend-text-less')
                    .attr('x', width - legendWidth - (SQUARE_LENGTH + SQUARE_PADDING))
                    .attr('y', height - 30 + SQUARE_LENGTH)
                    .text(locale.Less);

                legendGroup.append('text')
                    .attr('class', 'calendar-heatmap-legend-text calendar-heatmap-legend-text-more')
                    .attr('x', (width - legendWidth + SQUARE_PADDING) + (colorRange.length + 1) * (SQUARE_LENGTH + SQUARE_PADDING))
                    .attr('y', height - 30 + SQUARE_LENGTH)
                    .text(locale.More);
            }

            dayRects.exit().remove();
            svg.selectAll('.month')
                .data(monthRange)
                .enter().append('text')
                .attr('class', 'month-name')
                .text(function (d) {
                    return locale.months[d.getMonth()];
                })
                .attr('x', function (d, i) {
                    let matchIndex = 0;
                    dateRange.find(function (element, index) {
                        matchIndex = index;
                        return moment(d).isSame(element, 'month') && moment(d).isSame(element, 'year');
                    });
                    if (matchIndex % 7 === 0) {
                        // The start at this column, we needn't move right.
                        return Math.floor(matchIndex / 7) * (SQUARE_LENGTH + SQUARE_PADDING);
                    } else {
                        // Move right a column to prevent label overlap.
                        return (Math.floor(matchIndex / 7) + 1) * (SQUARE_LENGTH + SQUARE_PADDING);
                    }
                })
                .attr('y', 0);  // fix these to the top

            locale.days.forEach(function (day, index) {
                index = formatWeekday(index);
                if (index % 2) {
                    svg.append('text')
                        .attr('class', 'day-initial')
                        .attr('transform', 'translate(-10,' + (SQUARE_LENGTH + SQUARE_PADDING) * (index + 1) + ')')
                        .style('text-anchor', 'middle')
                        .attr('dy', "2")
                        .text(day);
                }
            });
        }

        function pluralizedTooltipUnit(count) {
            if ('string' === typeof tooltipUnit) {
                return (tooltipUnit + (count === 1 ? '' : 's'));
            }
            for (let i in tooltipUnit) {
                const _rule = tooltipUnit[i];
                const _min = _rule.min;
                let _max = _rule.max || _rule.min;
                _max = _max === 'Infinity' ? Infinity : _max;
                if (count >= _min && count <= _max) {
                    return _rule.unit;
                }
            }
        }

        function tooltipHTMLForDate(d) {
            const dateStr = moment(d).format('ddd, MMM Do YYYY');
            const count = countForDate(d);
            return '<span><strong>' + (count ? count : locale.No) + ' ' + pluralizedTooltipUnit(count) + '</strong> ' + locale.on + ' ' + dateStr + '</span>';
        }

        function countForDate(d) {
            const key = moment(d).format('YYYY-MM-DD');
            return counterMap[key] || 0;
        }

        function formatWeekday(weekDay) {
            if (weekStart === 1) {
                if (weekDay === 0) {
                    return 6;
                } else {
                    return weekDay - 1;
                }
            }
            return weekDay;
        }
    }

    return chart;
}

export {
    barChart,
    histogram,
    calendarHeatmap,
};