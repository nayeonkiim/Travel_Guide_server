
var dataArr = [ // <-A
    { count: 0 },
    { count: 0 },
    { count: 0 },
    { count: 0 },
    { count: 0 },
    { count: 0 }
];

function select(category) {
    const fordata = { 'subPlace': category };
    axios.post('/map/ages', fordata)
        .then((res) => {
            console.log("dataArr: " + dataArr);
            for (let i = 0; i < res.data.length; i++) {
                const givenAge = parseInt(res.data[i].age);
                if (givenAge >= 20 && givenAge < 30) {
                    dataArr[0].count += 1;
                    dataArr[0].category = "20대";
                } else if (givenAge >= 30 && givenAge < 40) {
                    dataArr[1].count += 1;
                    dataArr[1].category = "30대"
                } else if (givenAge >= 40 && givenAge < 50) {
                    dataArr[2].count += 1;
                    dataArr[2].category = "40대";
                } else if (givenAge >= 50 && givenAge < 60) {
                    dataArr[3].count += 1;
                    dataArr[3].category = "50대";
                } else if (givenAge >= 60 && givenAge < 70) {
                    dataArr[4].count += 1;
                    dataArr[4].category = "60대";
                } else {
                    dataArr[5].count += 1;
                    dataArr[5].category = "70대이상";
                }
            }
        }).then((res) => {
            console.log(dataArr);
            render(dataArr);
        }).then((res) => {
            for (let k = 0; k < dataArr.length; k++) {
                dataArr[k].count = 0;
                dataArr[k].category = "";
            }
        })
}

var width = 500;
var height = 500;

var color = d3.scale
    .linear()
    .domain([0, 60])
    .range(["red", "blue"]);

var witdhScale = d3.scale
    .linear()
    .domain([0, 10])
    .range([0, width]);

var y = d3.scale.linear()
    .domain([0, 6])
    .range([height, 0])

var x = d3.scale.linear()
    .domain([0, 6])
    .range([0, width])

var axis = d3.svg.axis().scale(witdhScale);

var canvas = d3.select("#container").append("svg").attr("width", width).attr("height", height).append("g").attr("transform", "translate(10, 20)");

function render(dataArr) {
    canvas.selectAll("rect")
        .data(dataArr)
        .enter()
        .append("rect")

    canvas.selectAll("rect")
        .data(dataArr)
        .exit().remove();

    canvas.selectAll("rect")
        .attr("width", function (d) {
            return witdhScale(d.count);
        })
        .attr('height', 50)
        .attr("fill", function (d) {
            return color(d.count);
        })
        .attr('y', function (d, i) {
            return i * 60
        })

    canvas.data(dataArr)
        .enter()
        .append("text")

    canvas.selectAll("text")
        .data(dataArr)
        .exit().remove()

    canvas.selectAll("text")
        .attr('x', function (d, i) {
            return witdhScale(d.count) - 20 * i;
        })
        .attr('y', function (d, i) {
            return -280 + i * 60
        })
        .text(function (d) { return d.category });

    canvas.append("g").attr("transform", "translate(0, 300)").call(axis);
}
