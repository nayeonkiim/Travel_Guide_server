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

router.get('/', (req, res, next) => {
    res.render('main');
});

router.get('/plus', (req, res, next) => {
    res.render('plus');
});

router.post('/', async (req, res, next) => {
    console.log('위치검색 라우터 호출됨');
    const place = req.body.place;
    const gender = req.body.gender;
    const age = req.body.age;
    console.log(req.body);
    //place 를 기준으로 관광지 테이블에서 해당 장소를 검색하고 중심좌표로 변경
    try {
        //관광지 조회
        const result = await TourPlace.findOne({
            where: { name: place },
            raw: true
        });
        console.log(result);

        let member = [];
        let totalMem = [];
        //입력한 관광지에 다녀간 user 모두 select
        const findLoc = await Location.findAll({
            include: [{
                model: TourSubPlace,
                where: { TourPlaceId: result.id },
            }],
            attribute: ['latitude', 'longitude', 'UserId'],
            order: ['UserId', 'time', 'date'],
        }).then(async el => {
            let necessary = [];
            if (gender == 'all' && age == 'all') {
                //console.log(el);
                return el;
            } else {
                for (let t = 0; t < el.length; t++) {
                    const addData = await User.findOne({
                        where: { id: el[t].UserId },
                        //attributes: ['id', 'gender', 'birth']
                    });
                    console.log(addData);

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
            if (el.dataValues == undefined)
                return null;
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
            if (route == null)
                totalMem[0] = 0;
            else {
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
            }
        });

        if (totalMem[0] != 0) {
            //TourPlace와 연관된 TourSubPlace 의 위도,경도 값 가져오기
            const subPlace = await TourSubPlace.findAll({
                where: { TourPlaceId: result.id },
                attributes: ['id', 'latitude', 'longitude', 'name'],
            });

            subPlace.map(e => {
                for (let i = 0; i < member.length; i++) {
                    //가장 많이 간 경로 순서대로 위도경도 값 넣어주기
                    if (e.id == member[i]) {
                        totalMem.push({ latitude: e.latitude, longitude: e.longitude });
                    }
                }
            });
            console.log(totalMem);
        } else {
            console.log("방문한 적 없는 관광지 입니다.");
            totalMem = null;
        }

        let avgTime = [];
        if (totalMem != null) {
            //머문 시간 평균 구하기
            for (let i = 0; i < subPlace.length; i++) {
                console.log(subPlace[i].name);
                const times = await Time.findAll({
                    where: { TourSubPlaceId: subPlace[i].id }
                });

                if (times == undefined || times == null || times == 0) continue;
                //동일한 subPlace 시간 합산
                let totalTime = times.map(t => t.total).reduce((a, b) => a + b, 0);
                let totalCount = times.length

                const avg = parseInt(totalTime / totalCount);
                console.log(avg);

                var time = Math.floor((avg % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                var min = Math.floor((avg % (1000 * 60 * 60)) / (1000 * 60));
                var sec = Math.floor((avg % (1000 * 60)) / 1000);
                avgTime.push({ 'name': subPlace[i].name, 'avg': time + "시간 " + min + "분 " + sec + "초" });
            }
        } else {
            avgTime = null;
            subPlace = null;
        }

        //웹에서 시각화
        //res.render('map', { place: place, latitude: result.latitude, longitude: result.longitude, subPlace: subPlace, totalMem: totalMem, avgTime: avgTime });
        const sending = { place: place, latitude: result.latitude, longitude: result.longitude, subPlace: subPlace, totalMem: totalMem, avgTime: avgTime };
        console.log(sending);
        return res.status(200).json({ place: place, latitude: result.latitude, longitude: result.longitude, subPlace: subPlace, totalMem: totalMem, avgTime: avgTime });

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
        //findOne으로 변경하기
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