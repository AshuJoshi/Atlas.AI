// 1. SETUP
const width = 1200;
const height = 800;

const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// Color scales
const color = d3.scaleOrdinal(d3.schemeCategory10);
const categoryColor = d3.scaleOrdinal(d3.schemeSet2);

// Load data
Promise.all([
    d3.csv("nodes.csv"),
    d3.csv("links.csv")
]).then(([nodes, links]) => {

    // 2. DATA PROCESSING
    nodes.forEach(d => {
        d.market_cap = +d.market_cap;
    });

    const nodeById = new Map(nodes.map(d => [d.id, d]));
    const validLinks = links.filter(link => nodeById.has(link.source) && nodeById.has(link.target));
    
    validLinks.forEach(link => {
        link.source = nodeById.get(link.source);
        link.target = nodeById.get(link.target);
    });

    const linkGroups = {};
    validLinks.forEach(link => {
        const key = `${link.source.id}-${link.target.id}`;
        if (!linkGroups[key]) {
            linkGroups[key] = [];
        }
        linkGroups[key].push(link);
    });
    Object.values(linkGroups).forEach(group => {
        if (group.length > 1) {
            group.forEach((link, i) => {
                link.link_num = i;
                link.total_links_in_group = group.length;
            });
        }
    });

    const radiusScale = d3.scaleSqrt()
        .domain([0, d3.max(nodes, d => d.market_cap)])
        .range([25, 120]);

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(validLinks).id(d => d.id).distance(200))
        .force("charge", d3.forceManyBody().strength(-600))
        .force("collide", d3.forceCollide().radius(d => radiusScale(d.market_cap) + 5).strength(1))
        .force("center", d3.forceCenter(width / 2, height / 2));

    const container = svg.append("g");

    // 3. DRAWING THE ELEMENTS 
    const defs = svg.append("defs");
    defs.selectAll("marker")
        .data([...new Set(validLinks.map(l => l.type))]).join("marker")
        .attr("id", d => `arrow-${d.replace(/\s+/g, '-')}`)
        .attr("viewBox", "0 -5 10 10").attr("refX", 10).attr("refY", 0)
        .attr("markerWidth", 6).attr("markerHeight", 6).attr("orient", "auto")
        .append("path").attr("fill", d => color(d)).attr("d", "M0,-5L10,0L0,5");
    defs.selectAll(".logo-pattern")
        .data(nodes.filter(d => d.logo)).join("pattern")
        .attr("class", "logo-pattern").attr("id", d => `logo-${d.id}`)
        .attr("width", 1).attr("height", 1).attr("viewBox", "0 0 50 50")
        .append("image").attr("href", d => d.logo)
        .attr("x", 0).attr("y", 0).attr("width", 50).attr("height", 50);

    const link = container.append("g")
        .attr("stroke-opacity", 0.6).attr("fill", "none")
        .selectAll("path").data(validLinks).join("path")
        .attr("stroke", d => color(d.type)).attr("stroke-width", 2)
        .attr("marker-end", d => `url(#arrow-${d.type.replace(/\s+/g, '-')})`);

    const node = container.append("g")
        .selectAll(".node").data(nodes).join("g")
        .attr("class", "node");

    node.append("circle")
        .attr("r", d => radiusScale(d.market_cap))
        .attr("fill", d => d.logo ? `url(#logo-${d.id})` : categoryColor(d.category))
        .style("cursor", "pointer");

    node.append("text")
        .attr("dy", 4).attr("text-anchor", "middle").text(d => d.name)
        .style("font-size", "15px").style("fill", "#000").style("stroke", "#fff")
        .style("stroke-width", "0.3px").style("paint-order", "stroke");

    const legend = svg.append("g").attr("transform", `translate(${width - 150}, 20)`);
    const legendItems = legend.selectAll(".legend-item").data(categoryColor.domain().sort()).join("g")
        .attr("class", "legend-item").attr("transform", (d, i) => `translate(0, ${i * 20})`);
    legendItems.append("rect").attr("width", 15).attr("height", 15).attr("fill", d => categoryColor(d));
    legendItems.append("text").attr("x", 20).attr("y", 12).text(d => d).style("font-size", "12px");
    
    const linkLegend = svg.append("g").attr("transform", `translate(${width - 150}, 150)`);
    const linkLegendItems = linkLegend.selectAll(".link-legend-item").data(color.domain().sort()).join("g")
        .attr("class", "link-legend-item").attr("transform", (d, i) => `translate(0, ${i * 20})`);
    linkLegendItems.append("rect").attr("width", 15).attr("height", 2).attr("fill", d => color(d));
    linkLegendItems.append("text").attr("x", 20).attr("y", 4).text(d => d).style("font-size", "12px");

    // 4. SIMULATION & INTERACTIVITY
    
    // DOUBLE-CLICK TO UNPIN NODES
    node.on("dblclick", (event, d) => {
        d.fx = null;
        d.fy = null;
        // Give the simulation a "kick" to re-arrange
        simulation.alpha(1).restart();
    });

    node.call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    simulation.on("tick", ticked);

    function ticked() {
        link.attr("d", d => {
            const sourceRadius = radiusScale(d.source.market_cap);
            const targetRadius = radiusScale(d.target.market_cap);
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance === 0) return null;

            const sourceX = d.source.x + (dx * sourceRadius) / distance;
            const sourceY = d.source.y + (dy * sourceRadius) / distance;
            const targetX = d.target.x - (dx * targetRadius) / distance;
            const targetY = d.target.y - (dy * targetRadius) / distance;

            if (d.total_links_in_group > 1) {
                const arcScale = 0.4;
                const sweep = d.link_num % 2 === 1 ? 1 : 0;
                const linkRad = d.link_num > 0 ? distance / (2.5 + (d.link_num * arcScale)) : distance;
                return `M ${sourceX},${sourceY} A ${linkRad},${linkRad} 0 0,${sweep} ${targetX},${targetY}`;
            } else {
                return `M ${sourceX},${sourceY} A ${distance},${distance} 0 0,1 ${targetX},${targetY}`;
            }
        });
        
        node.attr("transform", d => `translate(${d.x}, ${d.y})`)
            .each(function(d) {
                const radius = radiusScale(d.market_cap);
                d.x = Math.max(radius, Math.min(width - radius, d.x));
                d.y = Math.max(radius, Math.min(height - radius, d.y));
            });
    }
    
    // DRAG FUNCTIONS FOR PINNING
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }
    function dragended(event, d) {
        // node stays pinned
        if (!event.active) simulation.alphaTarget(0);
    }

    const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on("zoom", (event) => {
            container.attr("transform", event.transform);
        });

    svg.call(zoom);

    // RESET FUNCTIONALITY
    d3.select("#reset-button").on("click", () => {
        // Un-pin all nodes
        nodes.forEach(d => {
            d.fx = null;
            d.fy = null;
        });

        // Reset the zoom and pan
        svg.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity // This resets zoom and pan
        );

        // Give the simulation a strong kick to rearrange everything
        simulation.alpha(1).restart();
    });

}).catch(error => {
    console.error("Error loading or processing the data:", error);
});