// 1. SETUP
const width = 1200;
const height = 800;

const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// Tooltip
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip");

// Color scales
const color = d3.scaleOrdinal(d3.schemeCategory10);
const categoryColor = d3.scaleOrdinal(d3.schemeSet2);

// Load data
Promise.all([
    d3.csv("nodes.csv"),
    d3.csv("links.csv"),
    d3.json("references.json")
]).then(([nodes, links, references]) => {

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

    const projectNodeSize = 80;

    const getNodeRadius = d => {
        if (d.type === 'Project') {
            return projectNodeSize / 1.5;
        }
        return radiusScale(d.market_cap);
    };

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(validLinks).id(d => d.id).distance(200))
        .force("charge", d3.forceManyBody().strength(-600))
        .force("collide", d3.forceCollide().radius(d => getNodeRadius(d) + 5).strength(1))
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

    

        // --- Click-to-pin Tooltip & Selection Logic ---

        let selectedLink = null;

    

        function clearSelection() {

            tooltip.style("opacity", 0).style("pointer-events", "none");

            link.attr("stroke-width", 2).attr("stroke-opacity", 0.6);

            selectedLink = null;

        }

    

            svg.on("click", (event) => {

    

                // Check if the click is on the background, not on a node

    

                if (event.target.tagName === 'svg') {

    

                    clearSelection();

    

                }

    

            });

    

        

    

            link

    

                .on("mouseover", function() {

    

                    if (selectedLink !== this) {

    

                        d3.select(this).attr("stroke-width", 4).attr("stroke-opacity", 1);

    

                    }

    

                })

    

                .on("mouseout", function() {

    

                    if (selectedLink !== this) {

    

                        d3.select(this).attr("stroke-width", 2).attr("stroke-opacity", 0.6);

    

                    }

    

                })

    

                .on("click", function(event, d) {

    

                    event.stopPropagation();

    

                    

    

                    // If the clicked link is already selected, deselect it

    

                    if (selectedLink === this) {

    

                        return clearSelection();

    

                    }

    

        

    

                    clearSelection();

    

                    selectedLink = this;

    

        

    

                    d3.select(this).attr("stroke-width", 4).attr("stroke-opacity", 1);

    

        

    

                    const referenceData = references[d.reference_id];

    

                    if (!referenceData) return;

    

        

    

                    // Sort references by date, newest first

    

                    referenceData.sort((a, b) => new Date(b.publication_date) - new Date(a.publication_date));

    

        

    

                    let htmlContent = `<strong>${d.type}</strong>`;

    

                    if (d.details) {

    

                        htmlContent += `<br/>${d.details}`;

    

                    }

    

                    htmlContent += `<hr/>`;

    

                    referenceData.forEach(ref => {

    

                        htmlContent += `<a href="${ref.url}" target="_blank">${ref.title}</a><br/>`;

    

                    });

    

        

    

                    tooltip.html(htmlContent)

    

                        .style("left", (event.pageX + 15) + "px")

    

                        .style("top", (event.pageY - 28) + "px")

    

                        .style("opacity", 1)

    

                        .style("pointer-events", "auto");

    

                });

    

    

        node.each(function(d) {

            const group = d3.select(this);

            if (d.type === 'Project') {

                group.append('rect')

                    .attr('width', projectNodeSize)

                    .attr('height', projectNodeSize)

                    .attr('x', -projectNodeSize / 2)

                    .attr('y', -projectNodeSize / 2)

                    .attr("rx", 4) // Rounded corners

                    .attr("ry", 4)

                    .attr("fill", categoryColor(d.category))

                    .style("cursor", "pointer");

            } else {

                group.append("circle")

                    .attr("r", d => radiusScale(d.market_cap))

                    .attr("fill", d => d.logo ? `url(#logo-${d.id})` : categoryColor(d.category))

                    .style("cursor", "pointer");

            }

        });

    const textElements = node.append("text")
        .attr("text-anchor", "middle")
        .style("font-size", "15px").style("fill", "#000").style("stroke", "#fff")
        .style("stroke-width", "0.3px").style("paint-order", "stroke");

    // Company Name
    textElements.append("tspan")
        .attr("x", 0)
        .text(d => d.name);

    // Formatted Market Cap
    textElements.append("tspan")
        .attr("x", 0)
        .attr("dy", "1.2em")
        .style("font-size", "12px")
        .text(d => {
            if (d.type === 'Company' && d.market_cap && +d.market_cap > 0) {
                const cap = +d.market_cap;
                if (cap >= 1000) {
                    return `$${(cap / 1000).toFixed(2)}T`;
                }
                return `$${cap}B`;
            }
            return "";
        });

    // Vertically center the text block
    textElements.each(function(d) {
        if (d.type === 'Company' && d.market_cap && +d.market_cap > 0) {
            d3.select(this).attr("transform", "translate(0, -8)");
        } else {
            d3.select(this).attr("dy", 4);
        }
    });

    const legend = svg.append("g").attr("transform", `translate(${width - 150}, 20)`);
    const legendItems = legend.selectAll(".legend-item").data(categoryColor.domain().sort()).join("g")
        .attr("class", "legend-item").attr("transform", (d, i) => `translate(0, ${i * 20})`);
    legendItems.append("rect").attr("width", 15).attr("height", 15).attr("fill", d => categoryColor(d));
    legendItems.append("text").attr("x", 20).attr("y", 12).text(d => d).style("font-size", "12px");
    
    // Position the link legend dynamically below the category legend
    const categoryLegendHeight = categoryColor.domain().length * 20;
    const linkLegendYPosition = 20 + categoryLegendHeight + 40; // Start Y + height + padding

    const linkLegend = svg.append("g").attr("transform", `translate(${width - 150}, ${linkLegendYPosition})`);
    const linkLegendItems = linkLegend.selectAll(".link-legend-item").data(color.domain().sort()).join("g")
        .attr("class", "link-legend-item").attr("transform", (d, i) => `translate(0, ${i * 20})`);
    linkLegendItems.append("rect").attr("width", 15).attr("height", 2).attr("fill", d => color(d));
    linkLegendItems.append("text").attr("x", 20).attr("y", 4).text(d => d).style("font-size", "12px");

    // --- Helper Functions ---
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    // --- Populate Sources List ---
    function populateSourcesList(references) {
        const allRefs = Object.values(references).flat();
        const uniqueRefs = [...new Map(allRefs.map(item => [item['url'], item])).values()];
        uniqueRefs.sort((a, b) => new Date(b.publication_date) - new Date(a.publication_date));

        const sourcesList = d3.select("#sources-list");
        sourcesList.selectAll(".source-item")
            .data(uniqueRefs)
            .join("div")
            .attr("class", "source-item")
            .html(d => `<a href="${d.url}" target="_blank">${d.title}</a> <span class="source-date">(${formatDate(d.publication_date)})</span>`);
    }

    populateSourcesList(references);


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
            const sourceRadius = getNodeRadius(d.source);
            const targetRadius = getNodeRadius(d.target);
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
                const radius = getNodeRadius(d);
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