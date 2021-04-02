const express = require('express');
const router = express.Router();
const admin = require('firebase-admin')
const Group = require('../models/group');
const User = require('../models/user');
const Token = require('../models/token');


router.post('/alarm', async (req, res, next) => {

    console.log('push 알람 라우터 호출');
    const title = req.body.title;
    let userMap = [];
    try {
        //title로 groupId 구하기
        const groupId = await Group.findOne({
            where: { title }
        })
            .then(async (groupId) => {
                //그룹이 존재한다면 그룹의 멤버들의 id 조회
                if (groupId) {
                    const users = await groupId.getUsers({
                        attributes: ['id'],
                        raw: true,
                        nest: true
                    }).then(users => {
                        userMap = users.map(el => el.id);
                    });
                }
            });
    } catch (err) {
        console.error(err);
        next(err);
    }

    //target_token은 푸시 메시지를 받을 디바이스의 토큰값
    let target_token = [];
    console.log(userMap);
    for (let i = 0; i < userMap.length; i++) {
        console.log(userMap[i]);
        //그룹 멤버들의 id 하나씩 target_token에 넣어주기
        try {
            const result = await Token.findOne({
                where: { userId: userMap[i] },
                attributes: ['token'],
                raw: true,
                nest: true
            }).then(result => {
                console.log("result: " + Object.keys(result).length);
                //token 값이 존재하는 경우
                if (Object.keys(result).length > 0) {
                    target_token.push(result.token);
                    console.log(target_token);
                } else {
                    //token 값이 존재하지 않는 경우
                    let approve = { "approve": "fail_tokenNull" }
                    console.log('token 값이 null 입니다.');
                    res.status(500).json(approve);
                }
            })
        } catch (err) {
            console.error(err);
            next(err);
        }
    }

    //firebase 알림주는 코드
    const message = {
        data: {
            title: 'yayaya',
            content: '데이터가 잘 가나요?',
        },
        tokens: target_token,
    }

    admin
        .messaging()
        .sendMulticast(message)
        .then((response) => {
            console.log(response.successCount + ' messages were sent successfully');
        });
});


module.exports = router;