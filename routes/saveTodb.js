const express = require('express');
const router = express.Router();
const fs = require('fs');
const TourPlace = require('../models/tourplace');


router.get('/', async (req, res, next) => {
    const dataBuffer = fs.readFileSync('./lib/data.json')
    const dataJSON = dataBuffer.toString();
    const data = JSON.parse(dataJSON);
    try {
        for (let i = 0; i < data.length; i++) {
            if (data[i].위도 != null && data[i].경도 != null && data[i].위도 != '' && data[i].경도 != '') {
                const insert = await TourPlace.create({
                    name: data[i].관광지명,
                    address: data[i].소재지지번주소,
                    latitude: data[i].위도,
                    longitude: data[i].경도
                });
            } else {
                continue;
            }
        }
        return res.status(200);
    } catch (err) {
        console.error(err);
        next();
    }
});

module.exports = router;