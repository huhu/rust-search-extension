var tooltip;
function histogram({ selector, width, height, data, color, margin }) {
    let yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(Math.min(10, d3.max(data, d => d.value))))
        .call(g => g.append("text")
            .attr("x", -margin.left)
            .attr("y", 10)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .text("Times"))
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
