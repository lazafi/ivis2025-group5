(() => {
  // define main elements
  const width = 600, height = 600;
  const map = d3.select("#map")
    .append("svg")
    .attr("viewBox", [0, 0, width, height]);
  const tileGroup = map.append("g").attr("id", "tile-group");
  const mapGroup = map.append("g").attr("id", "map-group");
  const legendGroup = map.append("g").attr("id", "legend-group");
  const pointsGroup = map.append("g").attr("id", "points-group");
  const hexGroup = map.append("g").attr("id", "hex-group");
  const tooltip = d3.select("#tooltip");

  const hist = d3.select("#bar")
    .append("svg")
    .attr("viewBox", [0, 0, width, height]);
  const barGroup = hist.append("g").attr("id", "bar-group");

  // used for all animations
  const getTransition = () => d3.transition()
    .duration(450)
    .ease(d3.easeCubicOut);

  const projection = d3.geoMercator();

  const colors = ["#fff5eb", "#fee8d3", "#fdd8b3", "#fdc28c", "#fda762", "#fb8d3d", "#f2701d", "#e25609", "#c44103", "#9f3303", "#7f2704"];

  const metricMeta = {
    price: { label: "Price (EUR)", format: d3.format(",.0f"), suffix: " EUR" },
    occupancy_rate: { label: "Occupancy rate (%)", format: d3.format(".1f"), suffix: "%" },
    number_of_reviews: { label: "Number of reviews", format: d3.format(",.0f"), suffix: "" },
    reviews_per_month: { label: "Reviews per month", format: d3.format(".2f"), suffix: "" },
    minimum_nights: { label: "Minimum nights", format: d3.format(",.0f"), suffix: "" }
  };

  const formatMetricValue = (key, value) => {
    const meta = metricMeta[key] || { format: d3.format(",.2f"), suffix: "" };
    return `${meta.format(value)}${meta.suffix}`;
  };

  const showTooltip = (event, html) => {
    tooltip.html(html).style("opacity", 1);
    moveTooltip(event);
  };

  const moveTooltip = (event) => {
    const offset = 16;
    tooltip
      .style("left", `${event.pageX + offset}px`)
      .style("top", `${event.pageY + offset}px`);
  };

  const hideTooltip = () => {
    tooltip.style("opacity", 0);
  };
  
  var hexbin = d3.hexbin()
    .extent([[0, 0], [width, height]])
    .radius(10)
    .x(d => d.x)
    .y(d => d.y);
    
  //var listings;
  var colorScale;
  var currentMetric = "price";
  var currentLevel = "wien";
  var fullGeojson;
  var allListings = [];

  const resetToCity = () => {
    if (!fullGeojson || !allListings.length) return;
    d3.select("#neighborhood-select").property("value", "wien");
    drawMap(fullGeojson, allListings, "wien", currentMetric);
  };

  const animateViewChange = () => {
    const cx = width / 2;
    const cy = height / 2;
    const start = `translate(${cx},${cy}) scale(0.96) translate(${-cx},${-cy})`;
    [mapGroup, hexGroup].forEach(group => {
      group
        .interrupt()
        .attr("opacity", 0)
        .attr("transform", start)
        .transition(getTransition())
        .attr("opacity", 1)
        .attr("transform", "translate(0,0)");
    });
  };

  const getColorScale = (listings, colorVar) => {
      const values = listings.map(d => d[colorVar]);
      return d3.scaleQuantile()
        .domain(values)
        .range(colors);
    }

  const drawTiles = () => {
      var tiles = d3.tile()
        .size([width, height])
        .scale(projection.scale() * 2 * Math.PI)
        .translate(projection([0, 0]))();
      
        tileGroup.selectAll("image").remove();
        tileGroup.selectAll("rect").remove();

        tileGroup.selectAll("image")
        .data(tiles)
        .enter().append("image")
          .attr("xlink:href", function(d) { return "https://" + "abc"[d[1] % 3] + ".tile.openstreetmap.org/" + d[2] + "/" + d[0] + "/" + d[1] + ".png"; })
          .attr("x", function(d) { return (d[0] + tiles.translate[0]) * tiles.scale; })
          .attr("y", function(d) { return (d[1] + tiles.translate[1]) * tiles.scale; })
          .attr("width", tiles.scale)
          .attr("height", tiles.scale); 

      tileGroup.append("rect")
      .attr("width", "100%")
      .attr("height", "100%")
      .style("fill", "white")
      .style("opacity", 0.7);
        return tiles;
    }


const createLegend = (colorScale, label) => {
              const legendStep = 20;
              const legendOffset = { x: 20, y: 30 };
              legendGroup.selectAll("*").remove();
              legendGroup.attr("transform", `translate(${legendOffset.x}, ${legendOffset.y})`);
              //const legend = svg.append("g").attr("class", "legend").attr("transform", "translate(20, 30)");
            const legendScale = d3.scaleLinear()
               .domain(d3.extent(colorScale.quantiles()))
               .range([0, colorScale.quantiles().length * legendStep]);
             //console.log(colorScale.quantiles().length);
             //console.log(d3.extent(colorScale.quantiles()));
              const legendAxis = d3.axisRight(legendScale)
                .ticks(colorScale.quantiles().length)
               // .ticks(colorScale.quantiles().length)
                //.tickValues(colorScale.quantiles())
                //.tickSize(10)
                //.tickPadding(20)
                .tickFormat(d => Math.round(d));
              legendGroup.append("g")
                .attr("class", "axis")
                .attr("transform", "translate(20, 0)")
                .call(legendAxis);
              legendGroup.append("g").selectAll("rect")
                .data(colorScale.quantiles())
                .enter().append("rect")
                .attr("x", 0)
                .attr("y", (d, i) => i * legendStep)
                .attr("width", 20)
                .attr("height", 20)
                .attr("fill", d => colorScale(d));
              legendGroup.append("text")
                .attr("x", 0)
                .attr("y", -10)
                .text(label);
            };
////////////////////////////////
  const drawMap = (geojson, listings, level, colorVar) => {
    //console.log(data); 
      // clear previous elements
    d3.selectAll("#back").remove();
    d3.selectAll("circle").remove();
    mapGroup.selectAll("path").remove();

    const isZoomChange = currentLevel !== level;
    currentMetric = colorVar;
    currentLevel = level;

      const padding = 14;
      projection.fitExtent([[padding, padding], [width - padding, height - padding]], geojson);

  drawTiles();

    map.on("click", null).on("click", () => {
      if (currentLevel !== "wien") {
        resetToCity();
      }
    });

    // draw map 
    mapGroup.selectAll("path")
     .data(geojson.features.filter(d => d.geometry.type === "Polygon" || d.geometry.type === "MultiPolygon"))
      .enter()
      .append("path")
      .attr("d", d3.geoPath().projection(projection))
      .attr("class", "neighbourhood")
      .attr("note", d => d.properties.neighbourhood)
      .style("stroke", "black")
      .style("fill", "white")
      .style("fill-opacity", 0.1)
      .on("click", (event, d) => {
        event.stopPropagation();
        const selected = d3.select("#neighborhood-select").property("value", d.properties.neighbourhood).selectAll("option:checked").property("value");
        drawDistrictMap(d.properties.neighbourhood, geojson, listings);
      })
      .append("title")
      .text(d => `${d.properties.neighbourhood}`);
 // prepare listing coordinates for hexbin
    

    /*var colorScale = d3.scaleQuantile()
    .domain(listing_coordinates.map(d => d[2]))
    .range(colors)
    */
    const showListings = listings.filter(d => d.neighbourhood === level || level === "wien")
    .map(d => {
      const coords = projection([d.longitude, d.latitude]);
      return {
        ...d, x: coords[0], y: coords[1]};
    });
    const renderMetric = (metricKey) => {
      colorScale = getColorScale(listings, metricKey);
      createLegend(colorScale, metricMeta[metricKey].label);
      drawHexMap(showListings
        .map(d =>  ({id: d.id, x: d.x, y: d.y, value: d[metricKey]}))
        .filter(d => d.value !== 0),
        geojson,
        listings);
      drawHistogram(showListings.map(d => d[metricKey]), metricMeta[metricKey].label, metricKey);
    };

    renderMetric(colorVar);

    if (isZoomChange) {
      animateViewChange();
    }

    d3.selectAll("input[name='var1']")
      .on("change", null)
      .on("change", () => {
        const selectedVar = d3.select("input[name='var1']:checked").property("value");
        currentMetric = selectedVar;
        renderMetric(selectedVar);
      });
  };


   const drawHexMap = (data, geojson, listings) => {
    const bins = hexbin(data);
    const t = getTransition();
    const maxBinSize = d3.max(bins, d => d.length) || 1;
    const sizeScale = d3.scaleSqrt()
      .domain([0, maxBinSize])
      .range([2, hexbin.radius()]);

    const hexes = hexGroup.selectAll("path")
      .data(bins.sort((a, b) => b.length - a.length), d => `${d.x}-${d.y}`);

    hexes.exit()
      .transition(t)
      .attr("opacity", 0)
      .remove();

    const hexEnter = hexes.enter()
      .append("path")
      .attr("transform", d => `translate(${d.x},${d.y})`)
      .attr("d", () => hexbin.hexagon(0))
      .attr("fill", d => colorScale(d3.median(d, e => e.value)))
      .attr("stroke", "rgba(21, 36, 34, 0.35)")
      .attr("stroke-width", 0.6)
      .attr("opacity", 0.9)
      .on("mouseenter", (event, d) => {
        const median = d3.median(d, e => e.value);
        showTooltip(event, `
          <div><strong>${metricMeta[currentMetric].label}</strong></div>
          <div>Median: ${formatMetricValue(currentMetric, median)}</div>
          <div>Listings: ${d.length}</div>
        `);
      })
      .on("mousemove", moveTooltip)
      .on("mouseleave", hideTooltip);

    const updatedHexes = hexEnter.merge(hexes)
      .on("click", (event, d) => {
        event.stopPropagation();
        if (!geojson || currentLevel !== "wien") return;
        const firstPoint = d[0];
        const coords = projection.invert([firstPoint.x, firstPoint.y]);
        if (!coords) return;
        const target = geojson.features.find(feature => d3.geoContains(feature, coords));
        if (target) {
          drawDistrictMap(target.properties.neighbourhood, geojson, listings);
        }
      });

    updatedHexes
      .transition(t)
      .attr("transform", d => `translate(${d.x},${d.y})`)
      .attr("d", d => hexbin.hexagon(sizeScale(d.length)))
      .attr("fill", d => colorScale(d3.median(d, e => e.value)));
      }


  const drawDistrictMap = (districtName, geojson, listings) => {
    colorVar = d3.select("input[name='var1']:checked").property("value")
    const district = geojson.features.find(d => d.properties.neighbourhood === districtName);
    projection.fitSize([width, height], district);
    const districtGeojson = {
      type: "FeatureCollection",
      features: [district]
    };
    drawMap(districtGeojson, listings, district.properties.neighbourhood, colorVar);

    // add back button aligned to right
    const backWidth = 88;
    const backMargin = 16;
    const backGroup = map.append("g")
      .attr("id", "back")
      .attr("class", "back")
      .style("cursor", "pointer")
      .attr("transform", `translate(${width - backMargin - backWidth}, ${backMargin})`)
      .on("click", e => {
      e.stopPropagation();
      resetToCity();
      });

    backGroup.append("rect")
      .attr("width", backWidth)
      .attr("height", 28)
      .attr("rx", 6)
      .attr("ry", 6);

    backGroup.append("text")
      .attr("x", backWidth / 2)
      .attr("y", 14)
      .attr("dominant-baseline", "middle")
      .attr("alignment-baseline", "middle")
      .attr("text-anchor", "middle")
      .text("Back");
    };
  const drawHistogram = (data, label, metricKey) => {
    const margins = {top: 20, right: 20, bottom: 60, left: 56};
    const w = width - margins.left - margins.right;
    const h = height - margins.top - margins.bottom;
    hist.selectAll("*").remove();

    const chart = hist.append("g")
      .attr("transform", `translate(${margins.left},${margins.top})`);

    const maxValue = d3.max(data) || 0;
    const x = d3.scaleLinear()
      .domain([0, maxValue])
      .nice()
      .range([0, w]);

    const bins = d3.bin()
      .domain(x.domain())
      .thresholds(x.ticks(12))(data);

    const y = d3.scaleLinear()
      .domain([0, d3.max(bins, d => d.length) || 1])
      .nice()
      .range([h, 0]);

    const xAxis = chart.append("g")
      .attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(6));

    xAxis.selectAll("text")
      .attr("dy", "0.75em");

    chart.append("g")
      .call(d3.axisLeft(y).ticks(5));

    chart.append("text")
      .attr("x", 0)
      .attr("y", -6)
      .attr("fill", "#51605c")
      .attr("font-size", "0.85rem")
      .text(label);

    chart.append("text")
      .attr("x", w / 2)
      .attr("y", h + 44)
      .attr("text-anchor", "middle")
      .attr("fill", "#51605c")
      .attr("font-size", "0.8rem")
      .text("Value range");

    chart.append("text")
      .attr("transform", `translate(${-44},${h / 2}) rotate(-90)`)
      .attr("text-anchor", "middle")
      .attr("fill", "#51605c")
      .attr("font-size", "0.8rem")
      .text("Listings");

    const t = getTransition();

    chart.append("g")
      .selectAll("rect")
      .data(bins, d => d.x0)
      .enter()
      .append("rect")
      .attr("x", d => x(d.x0) + 1)
      .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 2))
      .attr("y", h)
      .attr("height", 0)
      .attr("rx", 2)
      .attr("fill", d => colorScale((d.x0 + d.x1) / 2))
      .on("mouseenter", (event, d) => {
        const range = `${formatMetricValue(metricKey, d.x0)} - ${formatMetricValue(metricKey, d.x1)}`;
        showTooltip(event, `
          <div><strong>${label}</strong></div>
          <div>Range: ${range}</div>
          <div>Listings: ${d.length}</div>
        `);
      })
      .on("mousemove", moveTooltip)
      .on("mouseleave", hideTooltip)
      .transition(t)
      .attr("y", d => y(d.length))
      .attr("height", d => h - y(d.length));
  };

const populateDropdown = (geojson) => {
  const selectDistrict = d3.select("#neighborhood-select");
      selectDistrict.selectAll("option")
    //  .data(["wien"].concat(geojson.features.map(d => d.properties.neighbourhood.replace(/[\u00A0-\u9999<>\&]/g, i => '&#'+i.charCodeAt(0)+';'))))
        .data(["wien"].concat(geojson.features.map(d => d.properties.neighbourhood)))
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d.charAt(0).toUpperCase() + d.slice(1));

      d3.select("#neighborhood-select").on("change", function(e) {
        e.stopPropagation();
        const value = d3.select(this).property("value");
        if (value === "wien") {
          drawMap(geojson, allListings, "wien", colorVar);
          drawHistogram(allListings.map(d => d[colorVar]));
          return;
        } else {
          drawDistrictMap(value, geojson, allListings);
        }
      });
    };

    const prepareHexbinData = (listings) => {
      return listings.filter(d => d.neighbourhood === currentLevel || currentLevel === "wien")
        .map(d => {
            const coords = projection([d.longitude, d.latitude]);
            return {
              ...d, x: coords[0], y: coords[1]};
             })
        .map(d =>  ({id: d.id, x: d.x, y: d.y, value: d[currentMetric]}))
         .filter(d => d.value !== 0)
    };


  // load data
  Promise.all([
    d3.json("./data/neighbourhoods.geojson"),        // GeoJSON data
    d3.dsv(",", "./data/listings.csv", d => ({       // CSV data
      id: d.id,
      name: d.name,
      neighbourhood: d.neighbourhood,
      latitude: +d.latitude,
      longitude: +d.longitude,
      availability_365: +d.availability_365,
      occupancy_rate: (1 - (+d.availability_365 / 365)) * 100,
      price: +d.price,
      number_of_reviews: +d.number_of_reviews,
      reviews_per_month: +d.reviews_per_month,
      minimum_nights: +d.minimum_nights,
      room_type: d.room_type,
    }))
  ]).then(([geojson, listings]) => {
    fullGeojson = geojson;
    allListings = listings;
    drawMap(fullGeojson, allListings, "wien", "price");

    // setup district dropdown
    populateDropdown(fullGeojson);

    // setup hexbin radius slider
      d3.select("#binSlider").on("change", function(e) {
         e.stopPropagation();
         const value = d3.select(this).property("value");
         hexbin.radius(+value);
          const selectedVar = d3.select("input[name='var1']:checked").property("value");
         drawHexMap(prepareHexbinData(allListings), fullGeojson, allListings, selectedVar);
       });
      
     
  });
})();
