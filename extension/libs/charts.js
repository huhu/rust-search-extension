function histogram({ selector, width, height, data, color, margin }) {
    let yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y))//.ticks(null, data.format))
        .call(g => g.append("text")
            .attr("x", -margin.left)
            .attr("y", 10)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .text("Times"));
    let xAxis = g => g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(i => data[i].name).tickSizeOuter(0));
    let y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value)]).nice()
        .range([height - margin.bottom, margin.top]);
    let x = d3.scaleBand()
        .domain(d3.range(data.length))
        .range([margin.left, width - margin.right])
        .padding(0.1);

    const svg = d3.select(selector)
        .append("svg")
        // .attr("viewBox", [0, 0, width, height]);
        .attr("width",width)
        .attr("height",height);
    svg.append("g")
        .attr("fill", color)
        .selectAll("rect")
        .data(data)
        .join("rect") 
        .attr("x", (d, i) => x(i)+x.bandwidth()/4)
        .attr("y", d => y(d.value))
        .attr("height", d => y(0) - y(d.value))
        .attr("width", x.bandwidth()/2);

    svg.append("g")
        .call(xAxis);

    svg.append("g")
        .call(yAxis);


}