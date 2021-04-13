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


module.exports = router;