const express = require('express');
const router = express.Router();
const { sequelize } = require('../models');
const TourSubPlace = require('../models/toursubplace');
const TourSubLocation = require('../models/toursublocation');
const User = require('../models/user');
const Group = require('../models/group');
const Location = require('../models/location');
const TourPlace = require('../models/tourplace');
const Time = require('../models/time');
const { Op } = require("sequelize");
const common = require('../lib/common');



router.post('/', async (req, res, next) => {
    console.log('멤버 위치 받기 라우터 호출');
    //날짜,시간,userId,위도,경도 값이 들어온다.
    const date = req.body.date;
    const time = req.body.time;
    const userId = req.body.userId;
    const latitude = parseFloat(req.body.latitude);
    const longitude = parseFloat(req.body.longitude);

    console.log(req.body);
    let approve = { "approve": "ok" };
    let nearSubPlace = [];
    let nearPlace = [];

    try {
        //user 정보 조회
        const userInfo = await User.findOne({
            where: { userId },
        })
        console.log(userInfo);

        //바로 이전의 위도경도 가져오기
        const lastest = await Location.findOne({
            where: { UserId: userInfo.id },
            order: ['date', 'time']
        });
        console.log(latest);

        if (latest != null) {
            //바로 이전 위도경도와 현재 위치와 차이가 많이 나면 현재위치 조정
            if (latest.latitude - latitude > 0.0002) {
                latitude += 0.0001;
            } else if (latitude - latest.latitude > 0.0002) {
                latitude -= 0.0001;
            }
            
            if (latest.longitude - longitude > 0.0002) {
                longitude += 0.0001;
            } else if (longitude - latest.longitude > 0.0002) {
                longitude -= 0.0001;
            }
        }

        //위도,경도(0.01보다 오차범위 작은) 근처 관광지 찾기
        const whichPlace = await TourPlace.findAll({
            where: {
                latitude: {
                    [Op.and]: {
                        [Op.gt]: latitude - 0.01,
                        [Op.lt]: latitude + 0.01
                    }
                },
                longitude: {
                    [Op.and]: {
                        [Op.gt]: longitude - 0.01,
                        [Op.lt]: longitude + 0.01
                    }
                }
            }
        }).then(place => {
            nearPlace = common.nearPlace(latitude, longitude, place);
            console.log("가장 가까운 관광지: " + nearPlace);

        });


        //위도,경도(0.0005보다 오차범위 작은) 근처 sub 관광지 찾기
        const whichSubPlace = await TourSubPlace.findAll({
            where: {
                [Op.and]: {
                    TourPlaceId: nearPlace,
                    latitude: {
                        [Op.and]: {
                            [Op.gt]: latitude - 0.0005,
                            [Op.lt]: latitude + 0.0005
                        }
                    },
                    longitude: {
                        [Op.and]: {
                            [Op.gt]: longitude - 0.0005,
                            [Op.lt]: longitude + 0.0005
                        }
                    }
                }
            }
        }).then(place => {
            let nearplacename = place.map(p => p.name);
            console.log(nearplacename);
            //여러개의 서브관광지 중 가장 가까운 곳 찾기
            nearSubPlace = common.nearPlace(latitude, longitude, place);
        });
        console.log("가까운 subPlace: " + nearSubPlace);

        const result = await sequelize.transaction(async (t) => {
            if (userInfo != null) {
                //위치 정보 저장
                const createLocation = await Location.create({
                    date,
                    time,
                    latitude,
                    longitude,
                }, { transaction: t });

                const addUser = await createLocation.setUser(userInfo, { transaction: t });
                console.log("정상적으로 위치 저장 완료");
                //새로 생성한 위치정보에 tourplace 정보 넣어주기
                const tour = await createLocation.addTourPlace(nearPlace, { transaction: t });
                console.log("정상적으로 관광지 장소와 연관 맺어주기 완료");


                //sub 관광 존재하면 연관관계 맺어주기
                if (nearSubPlace == null || nearSubPlace == undefined || nearSubPlace.length == 0) {
                    console.log('관광지 안의 sub 관광지에 있지 않습니다.');
                } else {
                    const subPlace = await createLocation.addTourSubPlace(nearSubPlace, { transaction: t });
                    console.log('관광지 안의 sub 관광지에 있습니다.');
                }

                return res.status(200).json(approve);
            } else {
                approve.approve = "없는 user 정보 입니다.";
                return res.status(500).json(approve);
            }
        })
    } catch (err) {
        console.error(err);
        next(err);
    }
});

router.get('/reload/:title/:date', async (req, res, next) => {
    console.log('멤버 실시간 위치 조회 라우터 호출됨');
    const title = req.params.title;
    const date = req.params.date;

    try {
        const users = await common.findMem(title);
        const id = users.filter(user => user.role == 'member').map(user => user.id);
        const usersId = users.filter(user => user.role == 'member').map(user => user.userId);

        console.log(id);
        console.log(usersId);

        let curLoc = [];
        //group의 모든 그룹원들의 가장 최근 위치 가져오기 
        for (let i = 0; i < id.length; i++) {
            console.log(id[i]);
            let location = await Location.findOne({
                where: { UserId: id[i], date },
                order: [['time', 'DESC']],
                attributes: ['latitude', 'longitude'],
                raw: true
            });
            if (location != null) {
                console.log(location);
                location.userId = usersId[i];
                curLoc.push(location);
            }
        }

        console.log(curLoc);
        let approve = { 'approve': 'fail' };
        if (curLoc.length < 0) {
            return res.status(500).json(approve);
        } else {
            approve.approve = 'ok';
            approve.curLoc = curLoc;
            return res.status(200).json(approve);
        }
    } catch (err) {
        console.error(err);
        next(err);
    }
});

router.post('/freetimeEnd', async (req, res, next) => {
    const title = req.body.title;
    const latitude = parseFloat(req.body.latitude);
    const longitude = parseFloat(req.body.longitude);

    console.log('자유시간 종료 버튼 눌러서 멤버들 위치로 sub 장소 평균시간 업데이트 라우터 호출');
    let date = new Date();
    let today = '';
    //오늘 날짜 가져오기
    if ((date.getMonth() + 1) < 10) {
        if (date.getDate() < 10)
            today = date.getFullYear() + '-0' + (date.getMonth() + 1) + '-0' + date.getDate();
        else
            today = date.getFullYear() + '-0' + (date.getMonth() + 1) + '-' + date.getDate();
    } else {
        if (date.getDate() < 10)
            today = date.getFullYear() + '-' + (date.getMonth() + 1) + '-0' + date.getDate();
        else
            today = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
    }
    console.log(today);

    let userMap = [];
    let nearPlace = [];
    let approve = { "approve": "ok" };
    try {
        //title로 groupId 구하기
        const result = await common.findMem(title);

        //role이 member인 경우만 userMap에 저장
        for (let i = 0; i < result.length; i++) {
            if (result[i].role != 'manager') {
                userMap.push(result[i].id);
            }
        }
        console.log(userMap);

        const whichPlace = await TourPlace.findAll({
            where: {
                latitude: {
                    [Op.and]: {
                        [Op.gt]: latitude - 0.01,
                        [Op.lt]: latitude + 0.01
                    }
                },
                longitude: {
                    [Op.and]: {
                        [Op.gt]: longitude - 0.01,
                        [Op.lt]: longitude + 0.01
                    }
                }
            }
        }).then(place => {
            console.log(place);
            nearPlace = common.nearPlace(latitude, longitude, place);
            console.log("가장 가까운 관광지: " + nearPlace);
        });

        const subPlaces = await TourSubPlace.findAll({
            where: { TourPlaceId: nearPlace },
            attributes: ['id'],
            raw: true
        });


        let timeSentArr = [];
        let timeSentTotalArr = [];
        //user 별로 방문 서브 관광지 별로 방문한 공간 find
        for (let i = 0; i < userMap.length; i++) {
            for (let j = 0; j < subPlaces.length; j++) {
                console.log("userId: " + userMap[i] + " subPlaceId: " + subPlaces[j].id);
                const result = await Location.findAll({
                    include: [{
                        model: TourSubLocation,
                        where: { id: { [Op.ne]: null }, TourSubPlaceId: subPlaces[j].id }
                    }],
                    where: { date: today, 'UserId': userMap[i] },
                }).then(result => {
                    //console.log(result);
                    if (result.length != 0) {
                        //맨처음 시간, 종료 시간만 저장
                        let first = { 'toursubplaceid': result[0].dataValues.TourSubLocations[0].TourSubPlaceId, 'time': result[0].time, 'userId': result[0].UserId };
                        let end = { 'toursubplaceid': result[result.length - 1].dataValues.TourSubLocations[0].TourSubPlaceId, 'time': result[result.length - 1].time, 'userId': result[result.length - 1].UserId };
                        timeSentArr.push(first);
                        timeSentArr.push(end);
                        timeSentTotalArr.push(timeSentArr);
                    }
                    timeSentArr = [];
                });
            }
        }
        console.log(timeSentTotalArr);



        let count = 0;
        let arr_curId = [];
        let spent = 0;
        //맨처음, 맨끝 시간 차이 저장하기
        for (let t = 0; t < timeSentTotalArr.length; t++) {
            var startdate = new Date(today + " " + timeSentTotalArr[t][0].time);
            var lastdate = new Date(today + " " + timeSentTotalArr[t][timeSentTotalArr[t].length - 1].time);
            console.log("startdate : " + startdate);
            console.log("lastdate : " + lastdate);
            var spend = lastdate - startdate;
            console.log("spend: " + spend);
            //subPlace에 대한 컬럼 없으면 생성

            const time = await Time.create({
                total: spend,
                UserId: timeSentTotalArr[t][0].userId,
                TourSubPlaceId: timeSentTotalArr[t][0].toursubplaceid
            });
        }
        return res.status(200).json(approve);
    } catch (err) {
        console.error(err);
        next(err);
    }
});


router.get('/:place', async (req, res, next) => {
    const place = decodeURIComponent(req.params.place);
    console.log(place);
    try {
        await TourPlace.findAll({
            where: {
                name: {
                    [Op.like]: "%" + place + "%"
                }
            },
            attributes: ['name']
        })
            .then(result => {
                if (result.length == 0) {
                    console.log(result);
                    return res.status(200).json({ "approve": "no_data" });
                } else {
                    console.log(result);
                    return res.status(200).json({ "approve": "ok", "places": result });
                }
            })
    } catch (err) {
        console.error(err);
        next(err);
    }

});


module.exports = router;