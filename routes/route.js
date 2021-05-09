const express = require('express');
const Route = require('../models/route');
const Product = require('../models/product');
const router = express.Router();
const { sequelize } = require('../models');
const TourPlace = require('../models/tourplace');

router.post('/', async (req, res, next) => {
    console.log("여행 상품 등록 라우터 호출");
    console.log(req.body.schedule);
    const title = req.body.title;
    const schedule = req.body.schedule;
    const introduce = req.body.introduce;
    const memo = req.body.memo;

    schedule = JSON.parse(schedule);
    try {
        //상품 등록
        const result = await sequelize.transaction(async (t) => {
            for (var i = 1; i <= Object.keys(schedule).length; i++) {
                //숫자 parsing
                const keyy = i.toString();
                var arr = schedule[keyy];
                console.log(arr);
                console.log(typeof (arr));
                for (var j = 0; j < Object.keys(arr).length; j++) {
                    //일정 경로 route 등록
                    const addRoute = await Route.create({
                        name: arr[j].name,
                        startTime: arr[j].startTime,
                        endTime: arr[j].endTime,
                        freeTime: arr[j].freeTimeChk,
                        day: arr[j].day,
                    })
                        .then(async addRoute => {
                            //상품 등록
                            const addProduct = await Product.create({
                                title,
                                introduce,
                                memo
                            }, { transaction: t });

                            console.log("addRouter: " + addRoute);
                            //장소 조회
                            const tourPlace = await TourPlace.findOne({
                                where: { name: addRoute.name }
                            });

                            //장소와 상품에 연관관계 맺어주기
                            await addRoute.setTourPlace(tourPlace, { transaction: t })
                            await addRoute.setProduct(addProduct, { transaction: t });
                        });
                }
            }
            return true;
        });

        if (result)
            return res.status(200).json({ "approve": "ok" });
        else
            return res.status(500).json({ "approve": "fail" });

    } catch (err) {
        console.error(err);
        next();
    }
});

module.exports = router;


