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


router.post('/', async (req, res, next) => {
    console.log('멤버 위치 받기 라우터 호출');
    //날짜,시간,userId,위도,경도 값이 들어온다.
    const date = req.body.date;
    const time = req.body.time;
    const userId = req.body.userId;
    const latitude = parseFloat(req.body.latitude);
    const longitude = parseFloat(req.body.longitude);
    const title = req.body.title;

    console.log(req.body);
    //트랜잭션 안에서 시작
    let approve = { "approve": "ok" };
    if (title == 'undefined' || title == undefined || title == null || title == 'null') {
        console.log(userId);
        try {
            //user 정보 조회
            const userInfo = await User.findOne({
                where: { userId },
            })
            console.log(userInfo);

            //위도,경도(0.01보다 오차범위 작은) 근처 관광지 찾기
            const whichPlace = await TourPlace.findOne({
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
            });
            console.log(whichPlace);

            //위도,경도(0.002보다 오차범위 작은) 근처 sub 관광지 찾기
            const whichSubPlace = await TourSubPlace.findOne({
                where: {
                    [Op.and]: {
                        TourPlaceId: whichPlace.id,
                        latitude: {
                            [Op.and]: {
                                [Op.gt]: latitude - 0.002,
                                [Op.lt]: latitude + 0.002
                            }
                        },
                        longitude: {
                            [Op.and]: {
                                [Op.gt]: longitude - 0.002,
                                [Op.lt]: longitude + 0.002
                            }
                        }
                    }
                }
            });
            console.log(whichSubPlace);

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
                    const tour = await createLocation.addTourPlace(whichPlace, { transaction: t });
                    console.log("정상적으로 관광지 장소와 연관 맺어주기 완료");


                    //sub 관광 존재하면 연관관계 맺어주기
                    if (whichSubPlace == null || whichSubPlace == undefined) {
                        console.log('관광지 안의 sub 관광지에 있지 않습니다.');
                    } else {
                        const subPlace = await createLocation.addTourSubPlace(whichSubPlace, { transaction: t });
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
    } else {
        console.log('멤버들 위치로 sub 장소 평균시간 업데이트 라우터 호출');
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
        let approve = { "approve": "ok" };
        try {
            //title로 groupId 구하기
            const groupId = await Group.findOne({
                where: { title }
            })
                .then(async (groupId) => {
                    //그룹이 존재한다면 그룹의 멤버들의 id 조회
                    if (groupId) {
                        const users = await groupId.getUsers({
                            attributes: ['id', 'role'],
                            raw: true,
                            nest: true
                        }).then(users => {

                            for (let i = 0; i < users.length; i++) {
                                if (users[i].role != 'manager') {
                                    userMap.push(users[i].id);
                                }
                            }
                        });
                    }
                });

            console.log("userMap " + userMap);

            let timeSentArr = [];
            let timeSentTotalArr = [];
            //user 별로 방문한 공간과 
            for (let i = 0; i < userMap.length; i++) {
                const result = await TourSubPlace.findAll({
                    include: [{
                        model: Location,
                        where: { 'UserId': userMap[i] },
                        attributes: ['time', 'UserId'],
                        order: ['id']
                    }],
                    attributes: ['id'],
                    raw: true
                }).then(result => {
                    let idx = 0;

                    for (let k = 0; k < result.length; k++) {
                        if (result[k].length == 0) continue;
                        let string = JSON.stringify(result[k]);
                        let arr_st = string.split(',');
                        let last = arr_st[1];
                        last = last.split(':');
                        let selecttime = { 'toursubplaceid': result[k].id, 'time': last[1].split(1) + ':' + last[2] + ':' + last[3], 'userId': userMap[i] };

                        if (k == 0) {
                            timeSentArr.push(selecttime);
                            idx = result[k].id;
                        } else {
                            if (result[k].id == idx) {
                                timeSentArr.push(selecttime);
                                if (k == result.length - 1) {
                                    timeSentTotalArr.push(timeSentArr);
                                    timeSentArr = [];
                                }
                            } else {
                                timeSentTotalArr.push(timeSentArr);
                                timeSentArr = [];
                                timeSentArr.push(selecttime);
                                idx = result[k].id;
                            }
                        }
                    }
                });
            }

            console.log(timeSentTotalArr);
            let count = 0;
            let arr_curId = [];
            let spent = 0;
            //맨처음, 맨끝 시간 차이 저장하기
            for (let t = 0; t < timeSentTotalArr.length; t++) {
                console.log(t);
                var startdate = new Date(today + " " + timeSentTotalArr[t][0].time.substring(1, timeSentTotalArr[t][0].time.length - 1));
                var lastdate = new Date(today + " " + timeSentTotalArr[t][timeSentTotalArr[t].length - 1].time.substring(1, timeSentTotalArr[t][timeSentTotalArr[t].length - 1].time.length - 1));
                console.log("startdate : " + startdate);
                console.log("lastdate : " + lastdate);
                var spend = lastdate - startdate;
                spent += spend;
                console.log(spend);

                for (let tt = 0; tt < timeSentTotalArr[t].length; tt++) {
                    if (!arr_curId.includes(timeSentTotalArr[t][tt].userId)) {
                        count += 1;
                        arr_curId.push(timeSentTotalArr[t][tt].userId);
                    }
                }
                console.log(arr_curId);
            }

            let toursubid = timeSentTotalArr[0][0].toursubplaceid;

            const time = await Time.create({
                total: spent,
                count: arr_curId.length,
                TourSubPlaceId: toursubid
            });


            return res.status(500).json(approve);
        } catch (err) {
            console.error(err);
            next(err);
        }
    }
});

router.get('/reload/:title/:date', async (req, res, next) => {
    console.log('멤버 실시간 위치 조회 라우터 호출됨');
    const title = req.params.title;
    const date = req.params.date;

    try {
        //그룹 멤버 조회하기
        const groupId = await Group.findOne({
            where: { title }
        });
        //멤버들만 가져오기
        const users = await groupId.getUsers({
            attributes: ['id', 'role', 'userId'],
            raw: true
        });
        const id = users.filter(user => user.role == 'member').map(user => user.id);
        const usersId = users.filter(user => user.role == 'member').map(user => user.userId);

        console.log(id);
        console.log(usersId);

        let curLoc = [];
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


router.get('/reload/:title/:date', async (req, res, next) => {
    console.log('멤버 실시간 위치 조회 라우터 호출됨');
    const title = req.params.title;
    const date = req.params.date;

    try {
        //그룹 멤버 조회하기
        const groupId = await Group.findOne({
            where: { title }
        });
        //멤버들만 가져오기
        const users = await groupId.getUsers({
            attributes: ['id', 'role', 'userId'],
            raw: true
        });
        const id = users.filter(user => user.role == 'member').map(user => user.id);
        const usersId = users.filter(user => user.role == 'member').map(user => user.userId);

        console.log(id);
        console.log(usersId);

        let curLoc = [];
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

module.exports = router;