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

    const container = document.querySelector(`${selector}`)
    if (container.hasChildNodes()) {
        container.innerHTML = null
    }

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