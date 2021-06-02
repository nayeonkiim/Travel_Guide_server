const Group = require('../models/group');
const User = require('../models/user');
const Route = require('../models/route')
const commons = require('../lib/common');
const Location = require('../models/location');
const TourSubPlace = require('../models/toursubplace');

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


exports.nearPlace = function (latitude, longitude, place) {
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


exports.getLocation = async function (result, gender, age) {
    let necessary = [];
    let visit = true;

    const findLoc = await Location.findAll({
        include: [{
            model: TourSubPlace,
            where: { TourPlaceId: result.id },
        }],
        attribute: ['latitude', 'longitude', 'UserId'],
        order: ['UserId', 'time', 'date'],
    }).then(async el => {

        if (gender == 'all' && age == 'all') {
            necessary = el;
        } else {
            for (let t = 0; t < el.length; t++) {
                //해당 관광지에 갔던 user들을 찾아
                const addData = await User.findOne({
                    where: { id: el[t].UserId },
                    //attributes: ['id', 'gender', 'birth']
                });
                //console.log(addData);

                //나이를 계산
                let calage = commons.calAge(addData.birth.substr(0, 4));
                //둘 다 선택된 경우
                if (gender != 'all' && age != 'all') {
                    if (calage >= parseInt(age) && calage < parseInt(age) + 10 && addData.gender == gender) {
                        necessary.push(el[t]);
                    }
                }
                //성별만 all 이 아닐때
                else if (gender != 'all') {
                    let com = false;
                    if (gender == 1)
                        com = true

                    if (addData.gender == com) {
                        necessary.push(el[t]);
                    }
                }
                //나이만 all 이 아닐때
                else if (age != 'all') {
                    if (calage >= parseInt(age) && calage < parseInt(age) + 10) {
                        necessary.push(el[t]);
                    }
                }
            }
        }
    });
    return necessary
}

exports.getRoutes = async function (result, gender, age) {
    let el = await commons.getLocation(result, gender, age);
    let route = [];
    let visit = true;
    let member = [];
    let totalMem = [];
    //해당 관광지에 사람들이 간 적이 없는 경우 (아직 데이터 없어)
    if (el == null || el == undefined || el.length == 0)
        visit = false;
    else {
        //console.log(el);
        let curUser = el[0].dataValues.UserId;
        let routeNum = [];
        //아이디 별로 routeNum에 넣기
        for (var index in el) {
            if (curUser == el[index].dataValues.UserId) {
                if (!routeNum.includes(el[index].dataValues.TourSubPlaces[0].dataValues.id))
                    routeNum.push(el[index].dataValues.TourSubPlaces[0].dataValues.id);
            } else {
                route.push(routeNum);
                routeNum = [];
                curUser = el[index].dataValues.UserId;
                routeNum.push(el[index].dataValues.TourSubPlaces[0].dataValues.id);
            }
        }
        route.push(routeNum);
    }

    if (visit == false) {
        return;
    }

    let routeMap = new Map();
    for (let i = 0; i < route.length; i++) {
        //map 에 경로가 key로 이미 있다면
        if (!routeMap.has("" + route[i])) {
            routeMap.set("" + route[i], 1);
        } else
            //경로 없을 경우 새로 생성
            routeMap.set("" + route[i], routeMap.get("" + route[i]) + 1);
    }

    let max = 0;
    const iterator1 = routeMap.values();
    const iterator2 = routeMap.keys();

    //가장 많이 간 경로(key) 찾기
    for (let i = 0; i < routeMap.size; i++) {
        let nextVal = iterator1.next().value;
        let nextKey = iterator2.next().value;
        if (max < nextVal) {
            max = nextVal;
            maxIdx = nextKey;
        }
    }
    maxIdx = maxIdx.split(',');
    member = maxIdx.map(e => parseInt(e));
    //console.log(member);


    //TourPlace와 연관된 TourSubPlace 의 위도,경도 값 가져오기
    let subPlace = await TourSubPlace.findAll({
        where: { TourPlaceId: result.id },
        attributes: ['id', 'latitude', 'longitude', 'name'],
    });

    subPlace.map(e => {
        for (let i = 0; i < member.length; i++) {
            //가장 많이 간 경로 순서대로 위도경도 값 넣어주기
            if (e.id == member[i]) {
                totalMem.push({ id: e.id, name: e.name, latitude: e.latitude, longitude: e.longitude });
            }
        }
    });
    return totalMem;
}

exports.calAge = function (age) {
    const now = new Date();	// 현재 날짜 및 시간
    const year = now.getFullYear();	// 연도
    const realAge = parseInt(year) - parseInt(age) + 1;
    const final = parseInt(realAge / 10) * 10;
    return final;
}