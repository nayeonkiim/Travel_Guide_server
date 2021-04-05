const express = require('express');
const router = express.Router();
const { sequelize } = require('../models');
const User = require('../models/user');
const Location = require('../models/location');

router.post('/', async (req, res, next) => {
    console.log('멤버 위치 받기 라우터 호출');
    const userId = req.body.userId;
    const latitude = parseFloat(req.body.latitude);
    const longitude = parseFloat(req.body.longitude);
    const date = req.body.date;
    //const date = Date.parse(req.body.date);

    console.log(req.body);
    //트랜잭션 안에서 시작
    try {
        let approve = { "approve": "ok" };

        let createLocation = [];
        const result = await sequelize.transaction(async (t) => {
            const userInfo = await User.findOne({
                where: { userId },
                raw: true,
            }, { transaction: t })
            console.log(userInfo);

            createLocation = await Location.create({
                date,
                latitude,
                longitude,
            })

            if (userInfo != null) {
                const addUser = await createLocation.setUser(userInfo.id);
                console.log(addUser);
                return res.status(200).json(approve);
            } else {
                //user 없는 경우
                approve.approve = "없는 user 정보 입니다.";
                return res.status(500).json(approve);
            }
        });
    } catch (err) {
        console.error(err);
        next(err);
    }
});

module.exports = router;