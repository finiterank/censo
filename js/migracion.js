var width = 800,
    height = 800,
    outerRadius = Math.min(width, height) / 2 - 10,
    innerRadius = outerRadius - 24;

var formatPercent = d3.format(".2%");

var last_layout = {};

var color = d3.scale.category20();

var arc = d3.svg.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius);

var layout = d3.layout.chord()
    .padding(.04)
    .sortSubgroups(d3.descending)
    .sortChords(d3.ascending);

var path = d3.svg.chord()
    .radius(innerRadius);

var svg = d3.select("#diagrama").append("svg")
    .attr("width", width)
    .attr("height", height)
  .append("g")
    .attr("id", "circle")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");



svg.append("circle")
    .attr("r", outerRadius);

queue()
    .defer(d3.text, "datos/migraciones.csv")
    .defer(d3.csv, "datos/nombresdep.csv")
    .await(ready);

function ready(error, matriz, departamentos){

    var m = d3.csv.parseRows(matriz).map(function(row){
        return row.map(function(value) {
            return +value;
        });
    });

    console.log(m);

    layout.matrix(m);

    var group = svg.selectAll(".group")
        .data(layout.groups)
        .enter().append("g")
        .attr("class", "group")
        .on("mouseover", mouseover);

    group.append("title").text(function(d, i) {
      return "Residentes en " + departamentos[i].nombre + ": " + formatPercent(d.value);
    });

    var groupPath = group.append("path")
        .attr("id", function(d, i) { return "group" + i; })
        .attr("d", arc)
        .style("fill", function(d, i) { return color(departamentos[i].nombre); });

    var chord = svg.selectAll(".chord")
        .data(layout.chords)
      .enter().append("path")
        .attr("class", "chord")
        .style("fill", function(d) { return color(departamentos[d.target.index].nombre); })
        .attr("d", path);

    var groupText = group.append("text")
        .attr("x", 6)
        .attr("dy", 15);

    groupText.append("textPath")
        .attr("xlink:href", function(d, i) { return "#group" + i; })
        .text(function(d, i) { return departamentos[i].nombre; });

    groupText.filter(function(d, i) { return groupPath[0][i].getTotalLength() / 2 - 26 < this.getComputedTextLength(); })
        .remove();

    chord.append("title").text(function(d) {
      return departamentos[d.target.index].nombre
          + " → " + departamentos[d.source.index].nombre
          + ": " + formatPercent(d.source.value)
          + "\n" + departamentos[d.source.index].nombre
          + " → " + departamentos[d.target.index].nombre
          + ": " + formatPercent(d.target.value);
    });

    function mouseover(d, i) {
      chord.classed("fade", function(p) {
        return p.source.index != i
            && p.target.index != i;
      });
    }
}
