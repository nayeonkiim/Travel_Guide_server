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
        const findLoc = await Location.findAll({
            include: [{
                model: TourLocation,
                where: { TourPlaceId: result.id }
            }],
            attribute: ['latitude', 'longitude', 'UserId'],
            order: ['time', 'UserId'],
            raw: true
        }).then(el => {
            let userid = el[0].UserId;
            for (let i = 0; i < el.length; i++) {
                if (userid == el[i].UserId) {
                    member.push({ latitude: el[i].latitude, longitude: el[i].longitude });
                    if (i == el.length - 1) totalMem.push(member);
                } else {
                    totalMem.push(member);
                    userid = el[i].UserId;
                    member = [];
                    member.push({ latitude: el[i].latitude, longitude: el[i].longitude });
                }
            }
        });


        //Location에서 TourSubPlace의 id 별로 가져와서 user 로 정렬해서 가져옴
        let subPlaceId = subPlace.map(el => el.id);
        for (let i = 0; i < subPlaceId.length; i++) {
            const allLoc = await Location.findAll({
                include: [{
                    model: TourSubLocation,
                    where: { TourSubPlaceId: subPlaceId[i] },
                }],
                order: ['UserId'],
                raw: true
            });
            console.log(allLoc);
        };
        console.log(totalMem);

        let avgTime = [];
        //머문 시간 평균 구하기
        for (let i = 0; i < subPlace.length; i++) {
            console.log(subPlace[i].name);
            const times = await subPlace[i].getTime();
            if (times == null) continue;

            const avg = parseInt(times.total / times.count);
            console.log(avg);

            var time = Math.floor((avg % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            var min = Math.floor((avg % (1000 * 60 * 60)) / (1000 * 60));
            var sec = Math.floor((avg % (1000 * 60)) / 1000);
            avgTime.push({ 'name': subPlace[i].name, 'avg': time + "시간 " + min + "분 " + sec + "초" });
        }

        res.render('map', { latitude: result.latitude, longitude: result.longitude, subPlace: subPlace, totalMem: totalMem, avgTime: avgTime });

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

module.exports = router;