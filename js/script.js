

(() => {
  // define main elements
  const width = 600, height = 600;
  const map = d3.select("#map")
    .append("svg")
    .attr("viewBox", [0, 0, width, height]);
  const mapGroup = map.append("g").attr("id", "map-group");
  const legendGroup = map.append("g").attr("id", "legend-group");
  const pointsGroup = map.append("g").attr("id", "points-group");
  const hexGroup = map.append("g").attr("id", "hex-group");

  const hist = d3.select("#bar")
    .append("svg")
    .attr("viewBox", [0, 0, width, height]);
  const barGroup = hist.append("g").attr("id", "bar-group");

  // used for all animations
  const getTransition = () => d3.transition()
    .duration(300)
    .ease(d3.easeLinear);

  const projection = d3.geoMercator();

  var hexbin = d3.hexbin()
    .extent([[0, 0], [width, height]])
    .radius(10)
    .x(d => d.x)
    .y(d => d.y);
    
  var listings;

  const getColorScale = (listings, colorVar) => {
      const values = listings.map(d => d[colorVar]);
      return d3.scaleQuantile()
        .domain(values)
        .range(["#fff5eb","#fee8d3","#fdd8b3","#fdc28c","#fda762","#fb8d3d","#f2701d","#e25609","#c44103","#9f3303","#7f2704"]);
    }


  // Legend as a separate svg group
  // param svg: the svg elemenst to append the legend to
  // param colorScale: the color scale used for the map
  // param extent: the extent of the data values
  const createLegend2 = (svg, colorScale, extent) => {
    const legend = svg.append("g").attr("transform", "translate(20, 30)");
   // const legendScale = d3.scaleLinear()
   //   .domain(extent)
   //   .range([0, 100]);
   // console.log(colorScale.quantiles());
    const legendAxis = d3.axisBottom(colorScale)
      .tickValues(colorScale.quantiles())
      //.tickSize(100)
      //.tickPadding(20)
      //.ticks(colorScale.quantiles().length)
      .tickFormat(d => Math.round(d));
    legend.append("g")
      .attr("class", "axis")
     // .attr("transform", "translate(10, 30)")
      .call(legendAxis);
    legend.selectAll("rect")
      .data(colorScale.quantiles())
      .enter().append("rect")
      .attr("x", (d, i) => i * 20)
      .attr("y", 10)
      .attr("width", 20)
      .attr("height", 20)
      .attr("fill", d => colorScale(d));
    legend.append("text")
      .attr("x", 0)
      .attr("y", -10)
      .text("Price (EUR)");
  };

const createLegend = (colorScale) => {
              legendGroup.selectAll("*").remove();
              //const legend = svg.append("g").attr("class", "legend").attr("transform", "translate(20, 30)");
            const legendScale = d3.scaleLinear()
               .domain(d3.extent(colorScale.quantiles()))
               .range(d3.extent(colorScale.quantiles()));
             console.log(colorScale.quantiles().length);
             console.log(d3.extent(colorScale.quantiles()));
              const legendAxis = d3.axisRight(legendScale)
                .ticks(10)
               // .ticks(colorScale.quantiles().length)
                //.tickValues(colorScale.quantiles())
                //.tickSize(10)
                //.tickPadding(20)
                .tickFormat(d => Math.round(d));
              legendGroup.append("g")
                .attr("class", "axis")
                .attr("transform", "translate(20, -39)")
                .call(legendAxis);
              legendGroup.append("g").selectAll("rect")
                .data(colorScale.quantiles())
                .enter().append("rect")
                .attr("x", 0)
                .attr("y", (d, i) => i * 20)
                .attr("width", 20)
                .attr("height", 20)
                .attr("fill", d => colorScale(d));
              legendGroup.append("text")
                .attr("x", 0)
                .attr("y", -10)
                .text("Price (EUR)");
            };
////////////////////////////////
  const drawMap = (geojson, listings, colorVar) => {
    //console.log(listings);
    projection.fitSize([width, height], geojson);
    
    // clear previous elements
    d3.selectAll("#back").remove();
    d3.selectAll("circle").remove();
    mapGroup.selectAll("path").remove();

    d3.select("#var1").on("change", function(e) {
        // Update the chart
        update();
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
      .on("click", (event, d) => drawDistrictMap(event, d, geojson, listings, colorVar))
      .append("title")
      .text(d => `${d.properties.neighbourhood}`);
 // prepare listing coordinates for hexbin
    const listing_coordinates = listings.map(d => {
      const coords = projection([d.longitude, d.latitude]);
      return  {x: coords[0], y: coords[1], value: d[colorVar]}
    })
    .filter(d => d.value !== 0); // filter out listings with price 0


    /*var colorScale = d3.scaleQuantile()
    .domain(listing_coordinates.map(d => d[2]))
    .range(["#fff5eb","#fee8d3","#fdd8b3","#fdc28c","#fda762","#fb8d3d","#f2701d","#e25609","#c44103","#9f3303","#7f2704"])
    */
    drawHexMap(listing_coordinates);

      const update = () => {
        // Get the selected variable
        const selectedVar = d3.select("#var1").property("value");
        console.log(selectedVar);
        // Update the map based on the selected variable
        // You can implement the logic to update the map here
        const data = listings.map(d => { 
          const coords = projection([d.longitude, d.latitude]);
          return  {x: coords[0], y: coords[1], value: d[selectedVar]}
        }).filter(d => d.value !== 0);
        drawHexMap(data);
      }
    };


   const drawHexMap = (data) => {

     
    // print first 10 data points
    console.log(data.slice(0,10));
        hexGroup.selectAll("path").remove();
        const colorScale = d3.scaleQuantile()
        .domain(data.map(d => d.value))
        .range(["#fff5eb","#fee8d3","#fdd8b3","#fdc28c","#fda762","#fb8d3d","#f2701d","#e25609","#c44103","#9f3303","#7f2704"]);
  

        var bins = hexbin(data);
        var sizeScale = d3.scaleSqrt()
          .domain([0, d3.max(bins, d => d.length)])
          .range([2, hexbin.radius()]);

        hexGroup.selectAll("path")
            .data(bins.sort(function(a, b) { return b.length - a.length; }))
            .enter().append("path")
            .attr("transform", d => `translate(${d.x},${d.y})`)
            .attr("d", d => {  return hexbin.hexagon(sizeScale(d.length)); })
            .attr("fill", function(d) {
              return colorScale(d3.median(d.map(e => e.value)));
            });

          createLegend(colorScale);
         
      }


  const drawDistrictMap = (event, district, geojson, listings, colorVar) => {
    console.log(district);
    event.stopPropagation();
    projection.fitSize([width, height], district);
    const t = getTransition();
    district_geojson = {
      type: "FeatureCollection",
      features: [district]
    };
    drawMap(district_geojson, listings.filter(d => d.neighbourhood === district.properties.neighbourhood), colorVar);
    drawHistogram(listings.filter(d => d.neighbourhood === district.properties.neighbourhood).map(d => d.price));

    // add back button
    map.append("text")
      .attr("id", "back")
      .attr("class", "back")
      .attr("width", 50)
      .attr("height", 30)
      .attr("x", width - 100)
      .attr("y", height - 50)
      .append("tspan")
      .text("[ BACK ]")
      .on("click", e => {
        e.stopPropagation();
        drawMap(geojson, listings, colorVar);
        drawHistogram(listings.map(d => d.price));

      });
  };

  drawHistogram = (data) => {

    // Set the dimensions and margins of the graph
    const margins = {top: 10, right: 30, bottom: 80, left: 20};
   const w = width - margins.left - margins.right, h = height - margins.top - margins.bottom;
    //remove previous histogram
    hist.selectAll("*").remove();


    var x = d3.scaleLinear()
      .domain([0, d3.max(data) ] )   
      .range([0, w]);
  
      hist.append("g")
      .attr("transform", "translate(0," + h + ")")
      .call(d3.axisBottom(x));

var histogram = d3.histogram()
      //.value(data)   // I need to give the vector of value
      .domain(x.domain())  // then the domain of the graphic
      .thresholds(x.ticks(10)); // then the numbers of bins

  // And apply this function to data to get the bins
  var bins = histogram(data);

  var y = d3.scaleLinear()
      .range([h, 0])
      .domain([0, d3.max(bins, function(d) { return d.length; })]);  
   
      hist.append("g")
      .call(d3.axisLeft(y));

      hist.selectAll("rect")
      .data(bins)
      .enter()
      .append("rect")
        .attr("x", 1)
        .attr("transform", function(d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
        .attr("width", function(d) { return x(d.x1) - x(d.x0) -1 ; })
        .attr("height", function(d) { return h - y(d.length); })
        .style("fill", "black")
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
      price: +d.price
    }))
  ]).then(([geojson, listings]) => {
    // print listing data
    //console.log(listings);

    //const geo = listing2geo(listings, geojson)
    //console.log(geo);

    // aggregate availability data grouped by neighbourhood
    //const hoods = d3.rollup(listings, v => Math.round(d3.mean(v, d => d.availability_365) / 365 * 100), d => d.neighbourhood);
    //const prices = listings.map(d => d.price);
    //var colorScale = d3.scaleQuantile()
    //.domain(prices)
    //.range(["#fff5eb","#fee8d3","#fdd8b3","#fdc28c","#fda762","#fb8d3d","#f2701d","#e25609","#c44103","#9f3303","#7f2704"])
 
   /* const colorScale = d3.scaleSequential(d3.interpolateOranges)
      .domain(d3.extent(Array.from(hoods.values())).reverse());
    */
 
    // call city draw function with the combined geojson data and aggregated availability data
    drawMap(geojson, listings, "price");
    //createLegend(svg, getColorScale(listings, "price"), d3.extent(Array.from(listings.map(d => d["price"])).reverse()));

    drawHistogram(listings.map(d => d.price));
  });
})();

