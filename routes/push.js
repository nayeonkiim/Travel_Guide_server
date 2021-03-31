const express = require('express');
const router = express.Router();
const admin = require('firebase-admin')
const Group = require('../models/group');
const User = require('../models/user');
const Token = require('../models/token');


router.get('/alarm/:title', async (req, res, next) => {

    console.log('push 알람 라우터 호출');
    const title = req.params.title;
    let userMap = [];
    try {
        //title로 groupId 구하기
        const groupId = await Group.findOne({
            where: { title }
        })
            .then(async (groupId) => {
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

    //target_token은 푸시 메시지를 받을 디바이스의 토큰값입니다
    let target_token = '';
    console.log(userMap);
    for (let i = 0; i < userMap.length; i++) {
        console.log(userMap[i]);
        try {
            const result = await Token.findOne({
                where: { userId: userMap[i] },
                attributes: ['token'],
                raw: true,
                nest: true
            }).then(result => {
                //token 값 넣어주기
                if (!result) {
                    target_token = result;

                    let message = {
                        data: {
                            title: '테스트 데이터 발송',
                            body: '데이터가 잘 가나요?',
                            style: '굳굳',
                        },
                        token: target_token,
                    }

                    admin
                        .messaging()
                        .send(message)
                        .then(function (response) {
                            console.log('Successfully sent message: : ', response)
                        })
                        .catch(function (err) {
                            console.log('Error Sending message!!! : ', err)
                        })
                } else {
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
});


module.exports = router;