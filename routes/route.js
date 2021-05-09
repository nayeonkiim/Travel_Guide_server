const express = require('express');
const Route = require('../models/route');
const Product = require('../models/product');
const router = express.Router();
const { sequelize } = require('../models');


router.post('/', async (req, res, next) => {
    console.log("여행 상품 등록 라우터 호출");
    const title = req.body.title;
    const route = req.body.route;
    const introduce = req.body.introduce;
    const memo = req.body.memo;

    try {
        //먼저 schedule에 해당하는 정보 routes 테이블에 저장
        const result = await sequelize.transaction(async (t) => {
            const addProduct = await Product.create({
                title,
                introduce,
                memo
            }, { transaction: t });

            for (var i = 1; i <= route.lenght; i++) {
                var arr = route.i;
                for (var j = 0; j < arr.lenght; j++) {
                    const addRoute = await Route.create({
                        name: arr[j].name,
                        startTime: arr[j].startTime,
                        endTime: arr[j].endTime,
                        freeTime: arr[j].freeTimeChk,
                        day: arr[j].day,
                    }, { transaction: t }
                        .then(async addRoute => {
                            await addRoute.setProduct(addProduct, { transaction: t });
                        }));
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


