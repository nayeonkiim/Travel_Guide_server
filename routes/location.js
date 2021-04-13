const express = require('express');
const router = express.Router();
const { sequelize } = require('../models');
const User = require('../models/user');
const Group = require('../models/group');
const Location = require('../models/location');
const TourPlace = require('../models/tourplace');
const { Op } = require("sequelize");


router.post('/', async (req, res, next) => {
    console.log('멤버 위치 받기 라우터 호출');
    //날짜,시간,userId,위도,경도 값이 들어온다.
    const date = req.body.date;
    const time = req.body.time;
    const userId = req.body.userId;
    const latitude = parseFloat(req.body.latitude);
    const longitude = parseFloat(req.body.longitude);

    console.log(req.body);
    //트랜잭션 안에서 시작
    try {
        let approve = { "approve": "ok" };

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

        const result = await sequelize.transaction(async (t) => {
            if (userInfo != null) {
                //위치 정보 저장
                const createLocation = await Location.create({
                    date,
                    time,
                    latitude,
                    longitude,
                }, { transaction: t });

                //새로 생성한 위치정보에 tourplace 정보 넣어주기
                await createLocation.addTourPlace(whichPlace);
            }
        });

        //받은 주소와 등록된 주소가 동일한지 확인
        const findaddr = await TourPlace.findOne({
            where: { address },
        }).then(async (findaddr) => {
            console.log("findaddr: " + findaddr);
            if (findaddr != null) {
                const save = await findaddr.addLocations(result);
                console.log("save:" + save);
            }
        });

        //user 정보가 있는 경우
        if (result != null) {
            //userId 와 위치정보 연관시켜주기
            const addUser = await result.setUser(userInfo);
            console.log("정상적으로 위치 저장 완료");
            return res.status(200).json(approve);
        } else {
            //user 없는 경우
            approve.approve = "없는 user 정보 입니다.";
            return res.status(500).json(approve);
        }

    } catch (err) {
        console.error(err);
        next(err);
    }
});


router.get('/visited/:title', async (req, res, next) => {
    console.log('멤버들이 30분 이상 방문한 공간 저장하는 라우터 호출');
    const title = req.params.title;
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
                        //manager가 아닌 멤버들에게만 push 알람 보내기 위해
                        for (let i = 0; i < users.length; i++) {
                            if (users[i].role != 'manager') {
                                userMap.push(users[i].id);
                            }
                        }
                    });
                }
            });

        console.log("userMap.length: " + userMap.length);
        let timeSentArr = [];
        for (let i = 0; i < userMap.length; i++) {
            //각 멤버별로 시간정보만 가져와
            console.log(userMap[i]);
            const todayVisit = await Location.findAll({
                where: { date: today, UserId: userMap[i] },
                attributes: ['date', 'time', 'latitude', 'longitude'],
                order: ['id'],
                raw: true
            });

            //방문 기록이 없는 경우 다음 user의 방문 기록 탐색
            if (todayVisit.length == 0)
                continue;

            console.log(todayVisit);

            let time = todayVisit.map(el => el.time);
            let latitude = todayVisit.map(el => el.latitude);
            let longitude = todayVisit.map(el => el.longitude);
            console.log("last time: " + time[todayVisit.length - 1]);
            console.log("first time: " + time[0]);

            //06:00:00 형식에서 시,분,초를 분리하기
            let lastTime = time[todayVisit.length - 1].split(':');
            let firstTime = time[0].split(':');
            let userData = '';
            //마지막 시간과 처음 시간 차이를 계산, 30분 이상시 timeSent에 저장
            if (lastTime[0] - firstTime[0] >= 1) {
                userData = userMap[i];
            } else if (lastTime[1] - firstTime[1] >= 30) {
                userData = userMap[i];
            }

            //'오늘 날짜, user정보, 위도, 경도' 로 str에 저장
            let str = today + "," + userData + ',' + latitude[0] + ',' + longitude[0];
            timeSentArr.push(str);
        }

        let approve = { "approve": "ok" };

        //30분 이상 방문한 user 기록이 없는 경우 return
        if (timeSentArr.length == 0) {
            approve.approve = 'ok_none';
            return res.status(200).send(approve);
        }

        //30분 이상 차이가 나면 다른 테이블로 저장
        for (let i = 0; i < timeSentArr.length; i++) {
            let timeData = timeSentArr[i].split(',');
            let dateInfo = timeData[0];  //날짜
            let userInfo = timeData[1];  //user의 id
            let latitude = timeData[2];  //위도
            let longitude = timeData[3]; //경도 

            //트랜잭션 안에서 시작
            const result = await sequelize.transaction(async (t) => {
                //user 정보 찾기
                const findUser = await User.findOne({
                    where: { id: userInfo }
                }).then(async (findUser) => {
                    let userAge = String(findUser.birth);  //user의 태어난 생년월일
                    let birthYear = userAge.substring(0, 4); //년도만 가져옴
                    //현재 년에서 태어난 년도 계산하여 20대, 30대 인지를 저장
                    let age = parseInt((parseInt(date.getFullYear()) - parseInt(birthYear) + 1) / 10) * 10;

                    console.log("birthYear: " + birthYear);
                    console.log("age: " + age);

                    //visit 테이블에 user와 위치, 날짜 정보 넣기
                    const createVisit = await Visit.create({
                        date: dateInfo,
                        latitude,
                        longitude,
                        age,
                        gender: findUser.gender
                    }, { transaction: t });
                    return createVisit;
                }).catch(err => {
                    console.error(err);
                    next(err);
                });
            });
        };
        //성공적으로 저장완료됨
        return res.status(200).send(approve);

    } catch (err) {
        console.error(err);
        next(err);
    }
});


module.exports = router;