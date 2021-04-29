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

router.post('/', async (req, res, next) => {
    console.log('위치검색 라우터 호출됨');
    const place = req.body.place;
    console.log(place);
    //place 를 기준으로 관광지 테이블에서 해당 장소를 검색하고 중심좌표로 변경
    try {
        const result = await TourPlace.findOne({
            where: { name: place },
            raw: true
        });
        console.log(result);

        //result에 연관된 TourSubPlace 의 위도,경도 값 가져오기
        const subPlace = await TourSubPlace.findAll({
            where: { TourPlaceId: result.id },
            attributes: ['id', 'latitude', 'longitude', 'name'],
        });

        console.log(subPlace);

        let member = [];
        let totalMem = [];
        //입력한 관광지에 다녀간 user 모두 select
        const findLoc = await Location.findAll({
            include: [{
                model: TourLocation,
                where: { TourPlaceId: result.id }
            }],
            attribute: ['latitude', 'longitude', 'UserId'],
            order: ['UserId', 'time', 'date'],
            raw: true

        }).then(el => {
            //id, 날짜 별로 배열에 저장
            let userid = el[0].UserId;
            let beforeDate = el[0].date;
            for (let i = 0; i < el.length; i++) {
                if (userid == el[i].UserId && el[i].date === beforeDate) {
                    member.push({ latitude: el[i].latitude, longitude: el[i].longitude });
                    if (i == el.length - 1) totalMem.push(member);
                } else {
                    totalMem.push(member);
                    userid = el[i].UserId;
                    beforeDate = el[i].date;
                    member = [];
                    member.push({ latitude: el[i].latitude, longitude: el[i].longitude });
                }
            }
        });
        console.log(totalMem);

        //Location에서 TourSubPlace의 id 별로 가져와서 user 로 정렬해서 가져옴
        // let subPlaceId = subPlace.map(el => el.id);
        // for (let i = 0; i < subPlaceId.length; i++) {
        //     const allLoc = await Location.findAll({
        //         include: [{
        //             model: TourSubLocation,
        //             where: { TourSubPlaceId: subPlaceId[i] },
        //         }],
        //         order: ['UserId', 'date'],
        //         raw: true
        //     });
        //     console.log("allLoc");
        //     console.log(allLoc);
        // };


        let avgTime = [];
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

        res.render('map', { place: place, latitude: result.latitude, longitude: result.longitude, subPlace: subPlace, totalMem: totalMem, avgTime: avgTime });

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
})

router.post('/ages', async (req, res, next) => {
    const place = req.body.place;
    const age = parseInt(req.body.age);
    let data = [];

    //tourplace에 대한 toursubplace 찾기
    let findPlaceId = await TourPlace.findOne({
        where: { name: place }
    });
    console.log(findPlaceId);
    //toursubplace 가져오기
    const subPlaces = await findPlaceId.getTourSubPlaces();

    //toursubplace의 id만 저장, name만 저장
    const ids = subPlaces.map(s => parseInt(s.id));
    const name = subPlaces.map(s => s.name);

    for (let i = 0; i < ids.length; i++) {
        //time 테이블에서 toursubplace의 id만 조회
        const time = await Time.findAll({
            where: { TourSubPlaceId: ids[i] }
        });

        if (time.length == 0) continue;

        let ageCountId = time.map(t => t.UserId);
        let count = 0;
        for (let i = 0; i < ageCountId.length; i++) {
            const getAge = await User.findOne({
                where: { id: ageCountId[i] },
                attributes: ['birth'],
                raw: true
            });

            const now = new Date();	// 현재 날짜 및 시간
            const year = now.getFullYear();	// 연도
            const finalAge = parseInt(year) - parseInt(getAge.birth.substr(0, 4)) + 1;
            if (finalAge >= age && finalAge < age + 10) {
                count += 1;
            }
        }
        data.push({ 'name': name[i], 'count': count });
    }
    console.log(data);
    res.json(data);
});

module.exports = router;