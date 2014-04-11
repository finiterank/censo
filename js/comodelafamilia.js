var width = 600,
    height = 700;

var datosMunicipioId = d3.map(),
    indDep = d3.map();

var projection = d3.geo.mercator()
    .scale(2000)
    .translate([width / 2, height / 2])
    .rotate([60,-42,5]);

var path = d3.geo.path()
    .projection(projection);

var svg = d3.select("#mapa").append("svg")
    .attr("width", width)
    .attr("height", height);

var info = d3.select("#datos-indice").append("div")

queue()
    .defer(d3.json, "mpio/municipios.col.json")
    .defer(d3.csv, "datos/serviciodomestico.csv", fillDatosMunicipios)
    .await(ready);

function ready(error, colombia) {

  var departamentos = topojson.feature(colombia, colombia.objects.depto);
  var municipios = topojson.feature(colombia, colombia.objects.mpio);

  municipios.features.forEach(function(unidad, i) {
    unidad.centroid = path.centroid(unidad);
    if (unidad.centroid.some(isNaN)) unidad.centroid = null;
  });

  console.log("Municipios: ", municipios);

  var dat = datosMunicipioId.values();

  var vectorindices = dat.filter(function(d){
     return d.pob >= 10000;
  }).map(function(d){
      return d.ind;
  });

  var datdpt = d3.nest()
    .key(function(d) { return d.dep; })
    .entries(dat);

  datdpt.forEach(function(dep){
    dep.pob = dep.values.map(function(d){return d.pob;}).reduce(suma);
    dep.empl = dep.values.map(function(d){return d.emplserv;}).reduce(suma);
    dep.ind = 100000 * dep.empl / dep.pob;
    indDep.set(dep.key, dep.ind);
  });

  var scaleIndices = d3.scale.linear()
      .domain([d3.min(vectorindices.filter(function(d){
          return d != 0;
      })), d3.max(vectorindices)])
      .range([1, 100]);

  svg.append("path")
     .datum(departamentos)
     .attr("d", path)
     .attr("class", "colombia-borde");

  svg.selectAll(".dpto")
     .data(departamentos.features)
     .enter().append("path")
     .attr("class", function(d) { return "dpto " + "_" + d.properties.name.toUpperCase();})
     .attr("d", path);

  svg.append("path")
     .datum(topojson.mesh(colombia, colombia.objects.depto, function(a, b) { return a !== b; }))
     .attr("d", path)
     .attr("class", "depto-borde");

  var circles = svg.selectAll("circle")
                           .data(municipios.features)
                           .enter()
                           .append("circle")
                           .attr("r", function(d){
                               var h = datosMunicipioId.get(d.id);
                               if(h != undefined){
                                   if(h.pob < 10000){
                                       return 0;
                                   }
                                   else{
                                       return Math.sqrt(scaleIndices(h.ind)/Math.PI);
                                   }
                               }
                               else{
                                   return 0;
                               }
                           })
                           .attr("cx", function(d){return d.centroid[0];})
                           .attr("cy", function(d){return d.centroid[1];})
                           .style("fill", "#ff6600")
                           .style("fill-opacity", 0.7)
                           .on("mouseover", function(d){
                                var h = datosMunicipioId.get(d.id);
                                var mun= d.properties.name;
                                var dpt= d.properties.dpt;
                                var dep = h.dep;
                                var ind = h["ind"].toFixed(2);
                                var inddepart = indDep.get(dep).toFixed(2);
                                var output = "<h4>"+ mun + ", " + dpt + "</h4>"
                                output += "<p class='indice-mun'>"+ ind +"</p>";
                                output += "<p class='indice-dep'>Índice departamental: "+ inddepart + "</p>";
                                info.html(output);
                            })
                            .on("mouseout", function(){
                                info.html("");
                            });
}


function calculoRadio(d){
    var h = datosMunicipioId.get(d.id);
    if(h.pob < 10000){
         return 0;
     }
    else{
        return 1;
    }
}

function fillDatosMunicipios(d){
    d.dep = +d.dep;
    d.mpio = +d.mpio;
    d.pob = +d.pob;
    d.emplserv = +d.emplserv;
    d.ind = +d.ind;
    datosMunicipioId.set(d.mpio, d);
}

function suma(a,b){return a+b;}

function sumArrays(a,b){
    var output = a;
    for(i = 0 ; i < a.length; i++){
        output[i] += b[i];
    }
    return output;
}
