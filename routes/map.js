const express = require('express');
const Location = require('../models/location');
const User = require('../models/user');
const Time = require('../models/time');
const TourLocation = require('../models/tourlocation');
const TourPlace = require('../models/tourplace');
const TourSubPlace = require('../models/toursubplace');
const TourSubLocation = require('../models/toursublocation');
const router = express.Router();
const { Op } = require('sequelize');
const { sequelize } = require('../models');
const Direction = require('../models/direction');

router.get('/', (req, res, next) => {
    //main.html로 이동
    res.render('main');
});

router.get('/plus', (req, res, next) => {
    //plus.html로 이동
    res.render('plus');
});

router.get('/monitor', (req, res, next) => {
    //place.html로 이동
    res.render('place');
});

router.post('/monitor', async (req, res, next) => {
    console.log('패키지 여행객들 모니터링 라우터 호출됨');
    const place = req.body.place;

    try {
        //place의 위도경도 값 조회
        const placeLoc = await TourPlace.findAll({
            include: {
                model: Location,
                attributes: ['date', 'time', 'latitude', 'longitude', 'UserId'],
                throw: TourLocation
            },
            where: { name: place },
            attributes: ['id', 'latitude', 'longitude'],
            order: [
                [Location, 'date'],
                [Location, 'UserId', 'desc'],
                [Location, 'time']
            ],
        });
        console.log(placeLoc);

        const center = { latitude: placeLoc[0].latitude, longitude: placeLoc[0].longitude };
        console.log("tourplace 위도 경도 : " + center.latitude + ", " + center.longitude);

        //user id만 따로 빼내기
        const loc = placeLoc.map(loc => loc.Locations);
        let ids = loc[0].map(place => place.UserId);

        let before = 0;
        ids = ids.filter(ne => {
            if (ne != before) {
                before = ne;
                return ne;
            }
        });

        console.log(ids);

        let userRoutes = [];
        let perUserRoutes = [];
        let count = 0;
        //place의 Id와 연관된 location 객체 user별로 select
        for (let i = 0; i < ids.length; i++) {
            for (let j = count; j < loc[0].length; j++) {
                let gps = [];
                //UserId 동일한 것만 따로 넣기
                if (ids[i] == loc[0][j].UserId) {
                    gps.latitude = loc[0][j].latitude;
                    gps.longitude = loc[0][j].longitude;
                    gps.UserId = loc[0][j].UserId;
                    perUserRoutes.push(gps);
                } else {
                    count = j;
                    break;
                }
            }

            userRoutes.push(perUserRoutes);
            perUserRoutes = [];
        }
        console.log(userRoutes);

        //TourPlace와 연관된 TourSubPlace 의 위도,경도 값 가져오기
        let subPlace = await TourSubPlace.findAll({
            where: { TourPlaceId: placeLoc[0].id },
            attributes: ['latitude', 'longitude', 'name'],
            raw: true
        });
        console.log(subPlace);

        res.render('monitor', { center: center, routes: userRoutes, leng: userRoutes.length, subPlace: subPlace });
    } catch (err) {
        console.error(err);
        next();
    }
});

router.post('/', async (req, res, next) => {
    console.log('위치검색 라우터 호출됨');
    const place = req.body.place;
    const gender = req.body.gender;
    const age = req.body.age;

    console.log(req.body);
    //place 를 기준으로 관광지 테이블에서 해당 장소를 검색하고 중심좌표로 변경
    try {
        let visit = true;
        //관광지 조회
        const result = await TourPlace.findOne({
            where: { name: place },
            raw: true
        });
        console.log(result);
        //등록되지 않은 관광지 메시지 보내주기
        if (result == undefined)
            return res.status(200).json({ "approve": "ok", "message": "등록되지 않은 관광지 입니다." })

        let member = [];
        let totalMem = [];
        let necessary = [];

        //입력한 관광지에 다녀간 user 모두 select
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
                return necessary;
            } else {
                for (let t = 0; t < el.length; t++) {
                    //해당 관광지에 갔던 user들을 찾아
                    const addData = await User.findOne({
                        where: { id: el[t].UserId },
                        //attributes: ['id', 'gender', 'birth']
                    });
                    console.log(addData);

                    //나이를 계산
                    let calage = calAge(addData.birth.substr(0, 4));
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
                return necessary;
            }
        }).then(async el => {
            //해당 관광지에 사람들이 간 적이 없는 경우 (아직 데이터 없어)
            if (el.length == 0)
                visit = false;
            else {
                let curUser = el[0].dataValues.UserId;
                let route = [];
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
                return route;
            }

        }).then(route => {
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
            console.log(member);
        });

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

        const subPlaceIds = totalMem.map(e => e.id);
        let finalDir = [];

        for (let i = 0; i < subPlaceIds.length - 1; i++) {
            await Direction.findOne({
                where: { seq: subPlaceIds[i] + "," + subPlaceIds[i + 1] },
                attribute: ['direct'],
                raw: true
            }).then(el => {
                if (el != null) {

                    let tol = el.direct.split(',');
                    for (let i = 0; i < tol.length; i += 2) {
                        finalDir.push({ latitude: tol[i], longitude: tol[i + 1] });
                    }
                }
            });
        }

        console.log("findDir : ");
        console.log(finalDir);

        let avgTime = [];
        //머문 시간 평균 구하기

        var k = 0;
        let mapUserId = necessary.map(ne => ne.UserId);
        console.log(mapUserId);
        mapUserId = mapUserId.filter(ne => {
            if (ne != k) {
                k = ne;
                return ne;
            }
        });

        console.log("mapUserId : ");
        console.log(mapUserId);

        let timeArr = [];
        let totaltimeArr = [];
        for (let i = 0; i < subPlace.length; i++) {
            timeArr[subPlace[i].name] = 0;
            timeArr.count = 0;
            for (let j = 0; j < mapUserId.length; j++) {
                console.log(subPlace[i].name);
                //한명의 user가 관광지 별로 머문 시간
                const times = await Time.findAll({
                    where: { TourSubPlaceId: subPlace[i].id, UserId: mapUserId[j] },
                    raw: true
                });

                if (times == undefined || times == null || times == 0) continue;
                console.log(times);
                for (let k = 0; k < times.length; k++) {
                    timeArr[subPlace[i].name] += times[k].total;
                    timeArr.count += 1;
                }
            }
            totaltimeArr.push(timeArr);
            timeArr = [];
        }
        console.log(totaltimeArr);


        for (let i = 0; i < subPlace.length; i++) {
            //동일한 subPlace 시간 합산
            let totalTime = totaltimeArr[i][subPlace[i].name];
            console.log(totalTime);
            let totalCount = totaltimeArr[i].count;
            console.log(totalCount);

            let avg = parseInt(totalTime / totalCount);
            console.log("avg: " + avg);

            if (isNaN(avg)) avg = 0;
            var time = Math.floor((avg % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            var min = Math.floor((avg % (1000 * 60 * 60)) / (1000 * 60));
            var sec = Math.floor((avg % (1000 * 60)) / 1000);
            avgTime.push({ 'name': subPlace[i].name, 'avg': time + "시간 " + min + "분 " + sec + "초" });
        }


        //가보지 않은 관광지인 경우 모두 null로 보냄
        if (subPlace.length == 0) subPlace = [];
        if (totalMem.length == 0) totalMem = [];
        if (avgTime.length == 0) avgTime = [];

        const sending = { place: place, latitude: result.latitude, longitude: result.longitude, subPlace: subPlace, totalMem: totalMem, order: finalDir, avgTime: avgTime };
        console.log(sending);

        const web = req.body.web;
        if (web == 'yes')
            //웹에서 요청하는 경우
            res.render('map', { place: place, latitude: result.latitude, longitude: result.longitude, subPlace: subPlace, totalMem: totalMem, order: finalDir, avgTime: avgTime, first: "first" });
        else if (web == 'axios')
            res.json({ place: place, latitude: result.latitude, longitude: result.longitude, subPlace: subPlace, totalMem: totalMem, order: finalDir, avgTime: avgTime, first: "no" });
        else
            //앱에서 요청하는 경우
            return res.status(200).json({ place: place, latitude: result.latitude, longitude: result.longitude, subPlace: subPlace, totalMem: totalMem, order: finalDir, avgTime: avgTime });

    } catch (err) {
        console.error(err);
        next(err);
    }
});

router.post('/addPlace', async (req, res, next) => {
    console.log('관광지 서브 장소 추가 라우터 호출됨');
    const name = req.body.name;
    const latitude = parseFloat(req.body.latitude);
    const longitude = parseFloat(req.body.longitude);

    try {
        //현재 위도경도로 부터 가까운 관광지 찾기 
        const nearPlace = await TourPlace.findAll({
            where: {
                latitude: {
                    [Op.gt]: latitude - 0.007,
                    [Op.lt]: latitude + 0.007
                },
                longitude: {
                    [Op.and]: {
                        [Op.gt]: longitude - 0.007,
                        [Op.lt]: longitude + 0.007
                    }
                }
            }
        });
        console.log(nearPlace);

        //sub 장소 table에 저장하기
        const result = await sequelize.transaction(async (t) => {
            for (let i = 0; i < Object.keys(nearPlace).length; i++) {
                const sub = await TourSubPlace.create({
                    name,
                    latitude,
                    longitude
                }, { transaction: t });

                //찾은 tour장소와 sub 장소 연관시켜주기
                const result = await sub.setTourPlace(nearPlace[i], { transaction: t });
                console.log('sub 정보 올바르게 저장 완료');
                res.status(200).json({ approve: "ok_save_sub" });

            }
        });
    } catch (err) {
        console.error(err);
        next();
    }
});

router.get('/place', async (req, res, next) => {
    console.log('sub 관광지 정보 보내는 라우터 호출');
    try {
        const subPlace = await TourSubPlace.findAll({
            attributes: ['name', 'latitude', 'longitude']
        });
        return res.status(200).json({ 'approve': 'ok', 'subPlaces': subPlace });
    } catch (err) {
        console.error(err);
        next();
    }
})

router.post('/ages', async (req, res, next) => {
    const subPlace = req.body.subPlace;
    console.log(req.body);
    let data = [];
    //subPlace의 id 구하기
    const tourId = await TourSubPlace.findOne({
        where: { name: subPlace },
        attributes: ['id'],
        raw: true
    });
    console.log(tourId);

    //subPlace에 대한 time만 가져오기
    const time = await Time.findAll({
        where: { TourSubPlaceId: tourId.id }
    });

    //UserId 가져오기
    let ageCountId = time.map(t => t.UserId);
    for (let i = 0; i < ageCountId.length; i++) {
        const getAge = await User.findOne({
            where: { id: ageCountId[i] },
            attributes: ['birth', 'gender'],
            raw: true
        });

        let final = calAge(getAge.birth.substr(0, 4));
        data.push({ 'subPlace': subPlace, 'age': final, 'gender': getAge.gender });
    }
    console.log(data);
    res.json(data);
});

function calAge(age) {
    const now = new Date();	// 현재 날짜 및 시간
    const year = now.getFullYear();	// 연도
    const realAge = parseInt(year) - parseInt(age) + 1;
    const final = realAge / 10 * 10;
    return final;
}

module.exports = router;