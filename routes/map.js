const express = require('express');
const TourPlace = require('../models/tourplace');
const router = express.Router();

router.get('/', (req, res, next) => {
    res.render('main');
});

router.post('/', async (req, res, next) => {
    const place = req.body.place;
    console.log(place);
    //place 를 기준으로 관광지 테이블에서 해당 장소를 검색하고 중심좌표로 변경
    try {
        const result = await TourPlace.findOne({
            where: { name: place },
            attributes: ['latitude', 'longitude']
        });

        res.render('map',
            { latitude: result.latitude, longitude: result.longitude });

    } catch (err) {
        console.error(err);
        next(err);
    }
});

router.post('/savePlace', async (req, res, net) => {
    
})

module.exports = router;