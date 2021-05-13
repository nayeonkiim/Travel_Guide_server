const Group = require('../models/group');
const User = require('../models/user');
const Route = require('../models/route')

//그룹 멤버 조회하기
exports.findMem = async function (title) {
    const groupId = await Group.findOne({
        where: { title }
    });
    console.log(groupId);
    //멤버들만 가져오기
    const users = await groupId.getUsers({
        attributes: ['id', 'role', 'userId'],
        raw: true
    });
    return users;
}

//상품의 경로 찾기
exports.routeInfo = async function (id) {
    let totalRoute = [];
    const routeInfo = await Route.findAll({
        where: { ProductId: id },
        raw: true
    }).then(routeInfo => {
        let k = 1;
        let subRoute = [];
        //day 별로 분류해서 배열에 push
        for (let i = 0; i < routeInfo.length; i++) {
            if (routeInfo[i].day == k) {
                subRoute.push(routeInfo[i]);
            } else {
                totalRoute.push(subRoute);
                subRoute = [];
                k += 1;
                subRoute.push(routeInfo[i]);
            }
        }
        totalRoute.push(subRoute);
    });
    return totalRoute;
}

exports.nearPlace = function (place) {
    //주변 관광지 중 가장 가까운 곳 선택
    let compare = [];
    let min = 0, minObj = 0;
    let nearSubPlace = [];
    //위도 경도 차이 계산
    place.forEach(x => {
        value = Math.sqrt(Math.pow(latitude - x.latitude, 2) + Math.pow(longitude - x.longitude, 2));
        compare.push({ 'id': x.id, 'value': value });
    });

    if (compare.length != 0) {
        //가까운 거리 찾기
        min = compare[0].value;
        minObj = compare[0];
        for (let i = 1; i < compare.length; i++) {
            if (compare[i].value < min) {
                min = compare[i].value;
                minObj = compare[i];
            }
        }
        //가장 거리 가까운
        nearSubPlace.push(minObj.id);
    }
    return nearSubPlace;
}