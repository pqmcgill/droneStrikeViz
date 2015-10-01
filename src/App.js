var React = require('react'),
  d3 = require('d3'),
  $ = require('jquery'),
  topojson = require('topojson');

var App = React.createClass({

  getInitialState () {
    return {
      droneStrikeData: []
    };
  },

  componentDidMount () {
    //this.drawMap();
    // get drone strike data
    $.ajax({
      type: 'GET',
      url: 'http://api.dronestre.am/data',
      dataType: 'json',
      async: true,
      success: this.loadData, 
      error: (err) => {
        console.error(err);
      }
    });
  },

  drawMap () {
    var width = $('#map').width(),
      height = width;
    
    var center = [60.740606, 4.911861],
      scale = 700,
      offset = [width / 2, height / 2];
    
    var projection = d3.geo.mercator()
    .center(center) // In the Indian Ocean
    .scale(scale)
    .translate(offset);
    
    var svg = d3.select('#map').append('svg')
      .attr('width', width)
      .style('border', 'solid black 2px')
      .attr('height', height);
    
    var path = d3.geo.path()
      .projection(projection);
    
    var calculateBoundingBox = (features) => {
      var topleft = [], bottomright = [];
      features.forEach((feature, i) => {
        var fbb = path.bounds(feature),
          ftl = fbb[0],
          fbr = fbb[1];
    
        if (i === 0) {
          topleft = ftl;
          bottomright = fbr;
        } else {
          if (ftl[0] < topleft[0]) { topleft[0] = ftl[0]; }
          if (ftl[1] < topleft[1]) { topleft[1] = ftl[1]; }
          if (fbr[0] > bottomright[0]) { bottomright[0] = fbr[0]; }
          if (fbr[1] > bottomright[1]) { bottomright[1] = fbr[1]; }
        }
      });
      return [topleft, bottomright];
    }
    
    d3.json('droneMap.json', (err, topology) => {
      var subunits = topojson.feature(topology, topology.objects.subunits).features;
      var b = calculateBoundingBox(subunits);
      b.height = Math.abs(b[1][1] - b[0][1]);
      b.width = Math.abs(b[1][0] - b[0][0]);
      var r = (b.height / b.width);
      var s = 0.75 * width;
    
      console.log(b, r, s);
      projection = projection
        .scale(s)
        .center(center);
    
      svg.attr('height', width * r);
    
      svg.selectAll('path')
        .data(subunits)
      .enter()
        .append('path')
        .attr('class', (d) => { return 'subunit ' + d.id; })
        .style('stroke', 'black')
        .attr('d', path);
        
    });
  },

  loadData (data) {
    this.setState({
      droneStrikeData: data.strike
    });
  },

  plotPoints () {
  //   append circles for each strike
    var svg = d3.select(this.getDOMNode()).select('svg');

    var maxDeaths = 0;
    for (var i = 0; i < data.strike.length; i++) {
      if (parseInt(data.strike[i].deaths) > maxDeaths) {
        maxDeaths = parseInt(data.strike[i].deaths);
      }
    }
    console.log(data);

    var newpoints = svg.selectAll('circle').data(data.strike).enter();

    newpoints.append('circle')
    .attr('id', (d) => { return 'circleBoom-' + d._id; })
    .attr('class', 'boom')
    .attr('cx', (d) => { return projection([Number(d.lon), 0])[0]; })
    .attr('cy', (d) => { return projection([0, Number(d.lat)])[1]; })
    .attr('r', 5)
    .transition().delay(100).duration(300)
    .attr('r', (d) => { return parseInt(d.deaths) * 3 + 5; } )
    .style('opacity', 0.3)
    .delay(400).duration(1000)
    .style('opacity', 0);

    newpoints.append('circle')
    .attr('id', (d) => { return 'circle-' + d._id; })
    .attr('class', 'point')
    .attr('cx', (d) => { return projection([Number(d.lon), 0])[0]; })
    .attr('cy', (d) => { return projection([0, Number(d.lat)])[1]; })
    .attr('r', 5);

    var points = svg.selectAll('circle');
    points.style('fill', 'red');

    svg.selectAll('circle').filter('.point')
    .on('mouseover', function(d) {
      console.log(d);
      d3.select('#circleBoom-' + d._id)
      .transition().duration(300)
      .attr('r', (d) => {
        return parseInt(d.deaths) * 5 + 5; 
      })
      .style('opacity', (d) => {
        return (maxDeaths - parseInt(d.deaths)) / 100;
      });
    })
    .on('mouseout', function(d) {
      d3.select('#circleBoom-' + d._id)
      .transition().duration(1000)
      .style('opacity', 0)
      .transition().duration(0)
      .attr('r', 5);
    });
  },

  render () {
    this.drawMap(this.state.data);
    this.plotPoints();
    return (
      <div id="map"/>
    );
  }
});

React.render(<App />, document.getElementById('app'));
