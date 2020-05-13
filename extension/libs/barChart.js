var tooltip;
function barChart({ margin, height, width, data, selector,color,}) {
    let barHeight = 25;
    let number = [];
    for(let i=0; i<10; i++){
        number[i] = `#${i}`
    }
    
    let yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).tickFormat(i => number[i]).tickSizeOuter(0));

    let xAxis = g => g
        .attr("transform", `translate(0,${margin.top})`)
        .call(d3.axisTop(x).ticks(width / 80))
        .call(g => g.select(".domain"))
        .selectAll("g")
        // .attr("transform", (d,i) => `translate(${margin.top},0)`);

    let y = d3.scaleBand()
        .domain(d3.range(data.length))
        .rangeRound([margin.top, height - margin.bottom])
        .padding(0.1);

    let x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value)])
        .range([margin.left, width - margin.right])
        // .domain(d3.range(data.length))
        // .range([margin.left, width - margin.right])
        // .padding(0.1);

    // let format = x.tickFormat(20);

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
        .attr("y", (d, i) => y(i))
        .attr("width", d => x(d.value) - x(0))
        .attr("height", y.bandwidth())
        .on('mouseover', function (d, i) {
            let tooltipWidth = 36;
            tooltip = d3.select(selector)
                .append('div')
                .attr('class', 'histogram-bar-tooltip')
                .html(`<span>${d.value}</span>`)
                .style('width', `${tooltipWidth}px`)
                .style('left',  x(d.value) + 5 + "px")
                .style('top', y(i)+y.bandwidth() / 6 - tooltipWidth / 6 + "px")
        })
        .on("mouseout", function (d, i) {
            // tooltip.remove();
        });

    svg.append("g")
        .attr("fill", "white")
        .attr("text-anchor", "end")
        .attr("font-family", "sans-serif")
        .attr("font-size", 12)
        .selectAll("text")
        .data(data)
        .join("text")
        .attr("x", d => x(d.value) - 4)
        .attr("y", (d, i) => y(i) + y.bandwidth() / 2)
        .attr("dy", "0.35em")
        .text(d => d.name);

    svg.append("g")
        .call(xAxis);

    svg.append("g")
        .call(yAxis);

}