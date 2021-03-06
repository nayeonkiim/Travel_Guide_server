const express = require('express');
const Route = require('../models/route');
const Product = require('../models/product');
const router = express.Router();
const { sequelize } = require('../models');
const TourPlace = require('../models/tourplace');
const common = require('../lib/common');

router.post('/', async (req, res, next) => {
    console.log("여행 상품 등록 라우터 호출");
    console.log(req.body.schedule);
    const title = req.body.title;
    const schedule = req.body.schedule;
    const introduce = req.body.introduce;
    const memo = req.body.memo;

    const par = JSON.parse(schedule);
    console.log(par);
    try {
        //상품 등록
        const result = await sequelize.transaction(async (t) => {
            const addProduct = await Product.create({
                title,
                introduce,
                memo
            }).then(async addProduct => {
                for (var i = 0; i < par.length; i++) {
                    for (var j = 0; j < par[i].length; j++) {
                        //일정 경로 route 등록
                        const addRoute = await Route.create({
                            name: par[i][j].name,
                            startTime: par[i][j].startTime,
                            endTime: par[i][j].endTime,
                            freeTime: par[i][j].freeTimeChk,
                            day: par[i][j].day,
                        }).then(async addRoute => {
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
            })
        });

        return res.status(200).json({ "approve": "ok" });

    } catch (err) {
        console.error(err);
        next();
    }
});


router.get('/title', async (req, res, next) => {
    console.log('여행 상품 title 보내주는 라우터 호출');
    try {
        //상품 전체 title 가져오기
        const title = await Product.findAll({
            attributes: ['title'],
            raw: true
        });

        console.log(title);
        return res.status(200).json({ "approve": "ok", "title": title });
    } catch (err) {
        console.error(err);
        next();
    }
});


router.get('/:title', async (req, res, next) => {
    console.log('상품 title에 해당하는 일정 넘겨주는 라우터 호출');
    const title = req.params.title;

    try {
        //title에 해당하는 상품 찾기
        const productInfo = await Product.findOne({
            where: { title }
        });

        //title에 해당하는 상품 없을 경우 없는 상품 message 보내주기
        if (productInfo == null) return res.status(500).json({ "approve": "fail", "message": "없는 상품입니다." });

        //상품의 경로 찾기
        const totalRoute = await common.routeInfo(productInfo.id);
        console.log(totalRoute);
        return res.status(200).json({ "approve": "ok", "product": productInfo, "route": totalRoute });
    } catch (err) {
        console.error(err);
        next();
    }
})


module.exports = router;


