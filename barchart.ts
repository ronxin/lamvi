// Reference: https://bl.ocks.org/mbostock/3885304

export default function drawBarChart(svg: d3.Selection<any>, data: number[],
      xlabel: string) {
  svg.selectAll('*').remove();
  if (data.length == 0) return;

  var margin = {top: 20, right: 20, bottom: 40, left: 40},
      width = 300 - margin.left - margin.right,
      height = 300 - margin.top - margin.bottom;

  var x = d3.scale.ordinal()
      .rangeRoundBands([0, width], .1)
      .domain(data.map((d,i) => ''+i));

  var y = d3.scale.linear()
      .range([height, 0])
      .domain([0, d3.max(data)]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")

  yAxis.ticks(10);

  svg = svg.append("g")
     .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
    .append('text')
      .text(xlabel)
      .attr('dx', width / 2)
      .attr('dy', "35")
      .attr('text-anchor', 'middle');

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis);

  svg.selectAll(".bar")
      .data(data)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d,i) { return x(''+i); })
      .attr("width", width * 0.95 / data.length)
      .attr("y", d => y(d))
      .attr("height", d => height - y(d));
}
