const express = require('express');
const Manager = require('../models/manager');
const Group = require('../models/group');
const router = express.Router();

router.get('/', (req, res, next) => {
    console.log('get 기본 라우터 호출');
    const message = { 'message': 'Welcome~' };
    return res.status(200).json(message);
});

router.post('/', (req, res, next) => {
    console.log('post 기본 라우터 호출');
});

router.get('/map/:title', async (req, res, next) => {
    const title = req.params.title;
    const result = await Group.findOne({
        where: { title },
    }).then(async (result) => {
        if (result != null) {
            const findManagerLoc = await Manager.findOne({
                where: { GroupId: result.id }
            });
            return findManagerLoc;
        } else
            return null;
    });

    if (result != null) {
        res.render('map', { latitude: `result.latitude`, longitude: `result.longitude` });
    } else {
        const approve = { "approve": "no latitude, no longitude" };
        res.status(500).json(approve);
    }
});


module.exports = router;