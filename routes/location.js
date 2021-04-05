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
    try {
        let approve = { "approve": "ok" };

        //트랜잭션 안에서 시작
        const result = await sequelize.transaction(async (t) => {
            //user 정보 찾기
            const user = await User.findOne({
                where: { userId },
                raw: true,
            })
                .then(async (user) => {
                    if (user != null) {
                        console.log(user);
                        //user가 존재하면 location 정보 저장
                        const result = await Location.create({
                            date,
                            latitude,
                            longitude,
                        }, { transaction: t })
                            .then(async (result) => {
                                console.log(result);
                                //만든 location 에 user 추가
                                const addUser = await result.setUser(user);
                                console.log(addUser);
                                return res.status(200).json(approve);
                            })
                            .catch(err => {
                                console.error(err);
                                next(err);
                            })
                    } else {
                        //user 없는 경우
                        approve.approve = "없는 user 정보 입니다.";
                        return res.status(500).json(approve);
                    }
                });
        });
    } catch (err) {
        console.error(err);
        next(err);
    }

});


module.exports = router;