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
const commons = require('../lib/common');

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
    let gender = req.body.gender;
    let age = req.body.age;

    console.log(req.body);
    //place 를 기준으로 관광지 테이블에서 해당 장소를 검색하고 중심좌표로 변경
    try {
        //관광지 조회
        const result = await TourPlace.findOne({
            where: { name: place },
            raw: true
        });
        console.log(result);
        //등록되지 않은 관광지 메시지 보내주기
        if (result == undefined)
            return res.status(200).json({ "approve": "ok", "message": "등록되지 않은 관광지 입니다." })

        let necessary = await commons.getLocation(result, gender, age);
        let totalMem = await commons.getRoutes(necessary, result, gender, age);

        console.log(totalMem);
        //입력한 관광지에 다녀간 user 모두 select

        let finalDir = [];
        if (totalMem != undefined) {
            const subPlaceIds = totalMem.map(e => e.id);

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
        }

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

        let timeArr = [];
        let totaltimeArr = [];
        let vist = {};
        let visitArr = [];

        //TourPlace와 연관된 TourSubPlace 의 위도,경도 값 가져오기
        let subPlace = await TourSubPlace.findAll({
            where: { TourPlaceId: result.id },
            attributes: ['id', 'latitude', 'longitude', 'name'],
        });

        for (let i = 0; i < subPlace.length; i++) {
            vist.name = subPlace[i].name;
            vist.cnt = 0;
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
                vist.cnt += 1;
                for (let k = 0; k < times.length; k++) {
                    timeArr[subPlace[i].name] += times[k].total;
                    timeArr.count += 1;
                }

            }
            visitArr.push(vist);
            totaltimeArr.push(timeArr);
            timeArr = [];
            vist = {};
        }
        console.log("visitArr: ");
        console.log(visitArr);

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
        if (totalMem == undefined) totalMem = [];

        const sending = { place: place, latitude: result.latitude, longitude: result.longitude, subPlace: subPlace, totalMem: totalMem, order: finalDir, avgTime: avgTime, visitArr: visitArr };
        console.log(sending);

        const web = req.body.web;
        if (web == 'yes')
            //웹에서 요청하는 경우
            res.render('map', { place: place, latitude: result.latitude, longitude: result.longitude, subPlace: subPlace, totalMem: totalMem, order: finalDir, avgTime: avgTime, first: "first" });
        else if (web == 'axios')
            res.json({ place: place, latitude: result.latitude, longitude: result.longitude, subPlace: subPlace, totalMem: totalMem, order: finalDir, avgTime: avgTime, first: "no" });
        else
            //앱에서 요청하는 경우
            return res.status(200).json(sending);

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

        let final = commons.calAge(getAge.birth.substr(0, 4));
        data.push({ 'subPlace': subPlace, 'age': final, 'gender': getAge.gender });
    }
    console.log(data);
    res.json(data);
});




module.exports = router;