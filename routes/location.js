const express = require('express');
const router = express.Router();

router.post('/', async (req, res, next) => {
    console.log('멤버 위치 받기 라우터 호출');
    const userId = req.body.userId;

});


module.exports = router;