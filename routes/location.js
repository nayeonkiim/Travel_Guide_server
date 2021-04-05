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
    //const date = new Date.parse(req.body.date);

    console.log(req.body);
    //트랜잭션 안에서 시작
    //const t = await sequelize.transaction();
    try {
        let approve = { "approve": "ok" };

        const createLocation = await Location.create({
            date,
            latitude,
            longitude,
        })
            .then(async (createLocation) => {
                const userInfo = await User.findOne({
                    where: { userId },
                    raw: true,
                })
                console.log(userInfo);

                if (userInfo != null) {
                    console.log(userInfo.id);
                    const addUser = await createLocation.setUser(userInfo.id);
                    console.log(addUser);
                    //await t.commit();
                    return res.status(200).json(approve);
                } else {
                    //user 없는 경우
                    //await t.rollback();
                    approve.approve = "없는 user 정보 입니다.";
                    return res.status(500).json(approve);
                }
            });


        // try {
        //     //만든 location 에 user 추가
        //     console.log(userInfo);
        //     const addUser = await createLocation.setUser(userInfo);
        //     console.log(addUser);
        //     await t.commit();
        //     return res.status(200).json(approve);
        // } catch (err) {
        //     await t.rollback();
        //     approve.approve = '실패';
        //     return res.status(500).json(approve);

        // }
    } catch (err) {
        // await t.rollback();
        console.error(err);
        next(err);
    }
});


module.exports = router;