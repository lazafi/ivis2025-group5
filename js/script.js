

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

  const hist = d3.select("#bar")
    .append("svg")
    .attr("viewBox", [0, 0, width, height]);
  const barGroup = hist.append("g").attr("id", "bar-group");

  // used for all animations
  const getTransition = () => d3.transition()
    .duration(300)
    .ease(d3.easeLinear);

  const projection = d3.geoMercator();

  const colors = ["#fff5eb","#fee8d3","#fdd8b3","#fdc28c","#fda762","#fb8d3d","#f2701d","#e25609","#c44103","#9f3303","#7f2704"]
  
  var hexbin = d3.hexbin()
    .extent([[0, 0], [width, height]])
    .radius(10)
    .x(d => d.x)
    .y(d => d.y);
    
  //var listings;
  var colorScale;

  const getColorScale = (listings, colorVar) => {
      const values = listings.map(d => d[colorVar]);
      console.log(values);
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
          .attr("xlink:href", function(d) { return "http://" + "abc"[d[1] % 3] + ".tile.openstreetmap.org/" + d[2] + "/" + d[0] + "/" + d[1] + ".png"; })
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


const createLegend = (colorScale) => {
              legendGroup.selectAll("*").remove();
              //const legend = svg.append("g").attr("class", "legend").attr("transform", "translate(20, 30)");
            const legendScale = d3.scaleLinear()
               .domain(d3.extent(colorScale.quantiles()))
               .range([0, colorScale.quantiles().length * 20]);
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
  const drawMap = (geojson, listings, level, colorVar) => {
    //console.log(data); 
      // clear previous elements
    d3.selectAll("#back").remove();
    d3.selectAll("circle").remove();
    mapGroup.selectAll("path").remove();


      projection.fitSize([width, height], geojson);

  drawTiles();

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
    const data = showListings
      .map(d =>  ({id: d.id, x: d.x, y: d.y, value: d[colorVar]}))
      .filter(d => d.value !== 0);

    d3.selectAll("input[name='var1']").on("change", function(e) {
        update();
      });


    drawHexMap(data);

      const update = () => {
        // Get the selected variable
        const selectedVar = d3.select("input[name='var1']:checked").property("value");
        console.log(selectedVar);
        // Update the map based on the selected variable
        // You can implement the logic to update the map here
 
         colorScale = getColorScale(listings, selectedVar);
        createLegend(colorScale);
        drawHexMap(showListings
          .map(d =>  ({id: d.id, x: d.x, y: d.y, value: d[selectedVar]}))
          .filter(d => d.value !== 0));
       drawHistogram(showListings.map(d => d[selectedVar]));
      }
    };


   const drawHexMap = (data) => {

     
    // print first 10 data points
    console.log(data.slice(0,10));
        hexGroup.selectAll("path").remove();
        /*const colorScale = d3.scaleQuantile()
        .domain(data.map(d => d.value))
        .range(colors);*/
  

        var bins = hexbin(data)
        
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
      }


  const drawDistrictMap = (districtName, geojson, listings) => {
    colorVar = d3.select("input[name='var1']:checked").property("value")
    const district = geojson.features.find(d => d.properties.neighbourhood === districtName);
    console.log(district);
    projection.fitSize([width, height], district);
    const t = getTransition();
    district_geojson = {
      type: "FeatureCollection",
      features: [district]
    };
    drawMap(district_geojson, listings, district.properties.neighbourhood, colorVar);
    drawHistogram(listings.filter(d => d.neighbourhood === district.properties.neighbourhood).map(d => d[colorVar]));

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
        d3.select("#neighborhood-select").property("value", "wien")
        drawMap(geojson, listings, "wien", colorVar);
        drawHistogram(listings.map(d => d[colorVar]));

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
      .range([0, w ]);
  
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
        .style("fill", function(d) { return colorScale(d.x0); })
  };

 const updateHexmap = (listings) => {
    // Get the selected variable
    const selectedVar = d3.select("input[name='var1']:checked").property("value");
    console.log(selectedVar);

    const selectedDistrict = d3.select("#neighborhood-select").property("value");
    const showListings = listings.filter(d => d.neighbourhood === selectedDistrict || selectedDistrict === "wien")
    .map(d => {
      const coords = projection([d.longitude, d.latitude]);
      return {
        ...d, x: coords[0], y: coords[1]};
    });
    // Update the map based on the selected variable
    // You can implement the logic to update the map here

    colorScale = getColorScale(listings, selectedVar);
    createLegend(colorScale);
    drawHexMap(showListings
      .map(d =>  ({id: d.id, x: d.x, y: d.y, value: d[selectedVar]}))
      .filter(d => d.value !== 0));
    drawHistogram(showListings.map(d => d[selectedVar]));
  }


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
      minimum_nights: +d.minimum_nights
    }))
  ]).then(([geojson, listings]) => {
    // print listing data
    console.log(listings.slice(0,100));

   // projection.fitSize([width, height], geojson);
    //drawTiles();

    colorScale = getColorScale(listings, "price");
    createLegend(colorScale);

    drawMap(geojson, listings, "wien", "price");
    //createLegend(svg, getColorScale(listings, "price"), d3.extent(Array.from(listings.map(d => d["price"])).reverse()));
    drawHistogram(listings.map(d => d.price));


      const selectDistrict = d3.select("#neighborhood-select") 
      // populate dropdown
      selectDistrict.selectAll("option")
        .data(["wien"].concat(geojson.features.map(d => d.properties.neighbourhood)))
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d.charAt(0).toUpperCase() + d.slice(1));

      d3.select("#neighborhood-select").on("change", function(e) {
        e.stopPropagation();
        const value = d3.select(this).property("value");
        if (value === "wien") {
          drawMap(geojson, listings, "wien", colorVar);
          drawHistogram(listings.map(d => d[colorVar]));
          return;
        } else {
          drawDistrictMap(value, geojson, listings);
        }
      });

       d3.select("#binSlider").on("change", function(e) {
         e.stopPropagation();
         const value = d3.select(this).property("value");
         hexbin.radius(+value);
         updateHexmap(listings);
       });
      })();
})();

