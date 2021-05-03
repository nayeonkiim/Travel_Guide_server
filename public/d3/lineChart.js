var chart = lineChart()
    .x(d3.scale.linear().domain([20, 70]))
    .y(d3.scale.linear().domain([0, 10]))
    .first();

function lineChart() {
    var _chart = {};

    var _width = 600, _height = 300,
        _margins = { top: 30, left: 30, right: 30, bottom: 30 },
        _x, _y,
        _data = [],
        _colors = d3.scale.category10(),
        _svg,
        _bodyG,
        _line;


    _svg = d3.select("body")
        .append("svg")
        .attr("height", _height)
        .attr("width", _width);

    _chart.first = function () {
        renderAxes(_svg);
        defineBodyClip(_svg);
        return _chart;
    }

    _chart.render = function () {
        renderBody(_svg);
    };

    //축 렌더링
    function renderAxes(svg) {
        var axesG = svg.append("g")
            .attr("class", "axes");

        renderXAxis(axesG);

        renderYAxis(axesG);
    }

    function renderXAxis(axesG) {
        var xAxis = d3.svg.axis()
            .scale(_x.range([0, quadrantWidth()]))
            .orient("bottom");  //축의 위치

        axesG.append("g")
            .attr("class", "x axis")
            .attr("transform", function () {
                return "translate(" + xStart() + "," + yStart() + ")";
            })
            .call(xAxis);

        d3.selectAll("g.x g.tick")
            .append("line")
            .classed("grid-line", true)
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 0)
            .attr("y2", - quadrantHeight());
    }

    function renderYAxis(axesG) {
        var yAxis = d3.svg.axis()
            .scale(_y.range([quadrantHeight(), 0]))
            .orient("left");

        axesG.append("g")
            .attr("class", "y axis")
            .attr("transform", function () {
                return "translate(" + xStart() + "," + yEnd() + ")";
            })
            .call(yAxis);

        d3.selectAll("g.y g.tick")
            .append("line")
            .classed("grid-line", true)
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", quadrantWidth())
            .attr("y2", 0);
    }

    function defineBodyClip(svg) {
        var padding = 5;

        svg.append("defs")
            .append("clipPath")
            .attr("id", "body-clip")
            .append("rect")
            .attr("x", 0 - padding)
            .attr("y", 0)
            .attr("width", quadrantWidth() + 2 * padding)
            .attr("height", quadrantHeight());
    }

    function renderBody(svg) {
        if (!_bodyG)
            _bodyG = svg.append("g")
                .attr("class", "body")
                .attr("transform", "translate("
                    + xStart() + ","
                    + yEnd() + ")")
                .attr("clip-path", "url(#body-clip)");

        renderLines();

        renderDots();
    }

    //연속된 데이터 배열 렌더링
    function renderLines() {
        //연속된 데이터 배열을 매핑하는 svg:path 만든다.
        _line = d3.svg.line() //
            .x(function (d) { return _x(d.x); })
            .y(function (d) { return _y(d.y); });

        _bodyG.selectAll("path.line")
            .data(_data)
            .enter()
            .append("path")
            .style("stroke", function (d, i) {
                return _colors(i); //<-4C, 이것의 인덱스에 기반을 두는 각 데이터 라인에 대해 다른 색상 설정
            })
            .attr("class", "line");

        _bodyG.selectAll("path.line")
            .data(_data)
            .exit().remove()

        _bodyG.selectAll("path.line")
            .data(_data)
            .transition()
            .attr("d", function (d) { return _line(d); });

    }

    //각 데이터 포인트를 표현하기 위한 svg:circle 요소 집합을 생성하는 유사한 렌더링 로직 수행
    function renderDots() {
        _data.forEach(function (list, i) {
            _bodyG.selectAll("circle._" + i) //업데이트 모드에서 데이터 라인이 각 업데이트에 의해 부드럽게 움직일 수 있도록 전환 설정
                .data(list)
                .enter()
                .append("circle")
                .attr("class", "dot _" + i);

            _bodyG.selectAll("circle._" + i)
                .data(list)
                .exit().remove();

            _bodyG.selectAll("circle._" + i)
                .data(list)
                .style("stroke", function (d) {
                    return _colors(i); //<-4F, 데이터 배열 인덱스에 기반을 두고 색을 조직
                })
                .transition() //<-4G, 데이터가 업데이트될 때마다 선을 따라 점을 이동할 수 있도록 전환효과 적용
                .attr("cx", function (d) { return _x(d.x); })
                .attr("cy", function (d) { return _y(d.y); })
                .attr("r", 4.5);
        });
    }

    function xStart() {
        return _margins.left;
    }

    function yStart() {
        return _height - _margins.bottom;
    }

    function xEnd() {
        return _width - _margins.right;
    }

    function yEnd() {
        return _margins.top;
    }

    function quadrantWidth() {
        return _width - _margins.left - _margins.right;
    }

    function quadrantHeight() {
        return _height - _margins.top - _margins.bottom;
    }

    _chart.width = function (w) {
        if (!arguments.length) return _width;
        _width = w;
        return _chart;
    };

    //매개변수가 없을 때는 게터로 동작하고 매개변수가 있을 때는 세터처럼 동작
    _chart.height = function (h) {
        if (!arguments.length) return _height;
        _height = h;
        return _chart;
    };

    _chart.margins = function (m) {
        if (!arguments.length) return _margins;
        _margins = m;
        return _chart;
    };

    _chart.colors = function (c) {
        if (!arguments.length) return _colors;
        _colors = c;
        return _chart;
    };

    _chart.x = function (x) {
        if (!arguments.length) return _x;
        _x = x;
        return _chart;
    };

    _chart.y = function (y) {
        if (!arguments.length) return _y;
        _y = y;
        return _chart;
    };

    _chart.addSeries = function (series) {
        _data.push(series);
        return _chart;
    };

    _chart.deleteSeries = function () {
        _data = [];
    }

    return _chart;
}

var numberOfSeries = 2,
    numberOfDataPoint = 6,
    data = []


function update(category) {
    var boyData = [
        { x: 20, y: 0 },
        { x: 30, y: 0 },
        { x: 40, y: 0 },
        { x: 50, y: 0 },
        { x: 60, y: 0 },
        { x: 70, y: 0 },
    ];
    var girlData = [
        { x: 20, y: 0 },
        { x: 30, y: 0 },
        { x: 40, y: 0 },
        { x: 50, y: 0 },
        { x: 60, y: 0 },
        { x: 70, y: 0 },
    ];

    const fordata = { 'subPlace': category };
    axios.post('/map/ages', fordata)
        .then((res) => {
            for (var i = 0; i < res.data.length; i++) {
                console.log(res.data[i].gender);
                //남자일 경우
                if (res.data[i].gender == 0) {
                    if (res.data[i].age >= 20 && res.data[i].age < 30) {
                        boyData[0].y += 1;
                    } else if (res.data[i].age >= 30 && res.data[i].age < 40) {
                        boyData[1].y += 1;
                    } else if (res.data[i].age >= 40 && res.data[i].age < 50) {
                        boyData[2].y += 1;
                    } else if (res.data[i].age >= 50 && res.data[i].age < 60) {
                        boyData[3].y += 1;
                    } else if (res.data[i].age >= 60 && res.data[i].age < 70) {
                        boyData[4].y += 1;
                    } else {
                        boyData[5].y += 1;
                    }
                } else {
                    if (res.data[i].age >= 20 && res.data[i].age < 30) {
                        girlData[0].y += 1;
                    } else if (res.data[i].age >= 30 && res.data[i].age < 40) {
                        girlData[1].y += 1;
                    } else if (res.data[i].age >= 40 && res.data[i].age < 50) {
                        girlData[2].y += 1;
                    } else if (res.data[i].age >= 50 && res.data[i].age < 60) {
                        girlData[3].y += 1;
                    } else if (res.data[i].age >= 60 && res.data[i].age < 70) {
                        girlData[4].y += 1;
                    } else {
                        girlData[5].y += 1;
                    }
                }
            }
            data.push(boyData);
            data.push(girlData);
            console.log(data);

            data.forEach(function (series) {
                chart.addSeries(series);
            });
            chart.render();
        }).then((res) => {
            data = [];
            chart.deleteSeries();
        })

}





