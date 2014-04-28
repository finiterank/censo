var width = 750,
    height = 750,
    outerRadius = Math.min(width, height) / 2 - 10,
    innerRadius = outerRadius - 24;

var formatPercent = d3.format(".2%");

var last_layout = {};

var color = d3.scale.category20b();

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
    .defer(d3.text, "datos/matriz-desplazamientos.csv")
    .defer(d3.text, "datos/dept-despl.csv")
    .await(ready);

function ready(error, matriz, dept){

    var departamentos = d3.csv.parseRows(dept)[0];

    console.log(departamentos);

    var m = d3.csv.parseRows(matriz).map(function(row){
        return row.map(function(value) {
            return +value;
        });
    });

    var transpuesta =  d3.transpose(m);

    var sumasdesplazados = transpuesta.map(function(d){
        return d.reduce(function(a,b){
            return a+b;
        });
    });

    console.log(sumasdesplazados);

    layout.matrix(m);

    var group = svg.selectAll(".group")
        .data(layout.groups)
        .enter().append("g")
        .attr("class", "group")
        .on("mouseover", mouseover);

    group.append("title").text(function(d, i) {
      var output = "Desplazados provenientes de " + departamentos[i] + ": " + d.value.toFixed(0);
      output += "\n" + "Desplazados asentados en " + departamentos[i] + ": " + sumasdesplazados[i];
      return output;
    });

    var groupPath = group.append("path")
        .attr("id", function(d, i) { return "group" + i; })
        .attr("d", arc)
        .style("fill", function(d, i) { return color(departamentos[i]); });

    var chord = svg.selectAll(".chord")
        .data(layout.chords)
      .enter().append("path")
        .attr("class", "chord")
        .style("fill", function(d) { return color(departamentos[d.source.index]); })
        .attr("d", path);

    var groupText = group.append("text")
        .attr("x", 6)
        .attr("dy", 15);

    groupText.append("textPath")
        .attr("xlink:href", function(d, i) { return "#group" + i; })
        .text(function(d, i) { return departamentos[i]; });

    groupText.filter(function(d, i) { return groupPath[0][i].getTotalLength() / 2 - 26 < this.getComputedTextLength(); })
        .remove();

    chord.append("title").text(function(d) {
      return departamentos[d.source.index]
          + " → " + departamentos[d.target.index]
          + ": " + d.source.value
          + "\n" + departamentos[d.target.index]
          + " → " + departamentos[d.source.index]
          + ": " + d.target.value;
    });

    function mouseover(d, i) {
      chord.classed("fade", function(p) {
        return p.source.index != i
            && p.target.index != i;
      });
    }
}
