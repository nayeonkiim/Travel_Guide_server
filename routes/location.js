const express = require('express');
const router = express.Router();
const { sequelize } = require('../models');
const User = require('../models/user');
const Location = require('../models/location');

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

        const result = await sequelize.transaction(async (t) => {
            if (userInfo != null) {
                //위치 정보 저장
                const createLocation = await Location.create({
                    date,
                    time,
                    latitude,
                    longitude,
                }, { transaction: t });

                return createLocation;
            }
        });

        //user 정보가 있는 경우
        if (result) {
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

module.exports = router;