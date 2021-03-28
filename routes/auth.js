const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const { sequelize } = require('../models');
const mailer = require('./mail');
const router = express.Router();


router.get('/join/:userId', async (req, res, next) => {
    console.log('아이디 중복확인 라우터 호출 됨');
    const userId = req.params.userId;
    console.log(userId);

    try {
        const user = await User.findOne({ where: { userId } });
        let approve = { 'approve': 'fail' };
        //해당 아이디 없는 경우 ok 전송
        if (!user) {
            approve.approve = 'ok';
            res.json(approve);
        }
        //해당 아이디 이미 있는 경우 fail 전송
        else {
            res.json(approve);
        }
    } catch (error) {
        console.error(error);
        next(error);
    }
})

//회원가입 라우터
router.post('/join', async (req, res, next) => {
    console.log('회원가입 라우터 호출 됨');

    //client로 부터 userId, password 값이 넘어온다.
    const userId = req.body.userId;
    const password = req.body.password;
    const name = req.body.name;
    const email = req.body.email;
    const birth = req.body.birth;
    const gender = req.body.gender;
    const role = req.body.role;

    try {
        let approve = { 'approve': 'ok' };
        //비밀번호 암호화
        const hash = await bcrypt.hash(password, 12);
        //트랜잭션 안에서 실행
        const result = await sequelize.transaction(async (t) => {
            await User.create({
                userId,
                password: hash,
                name,
                email,
                birth,
                gender,
                role
            }, { transaction: t });
        });
        //회원가입이 완료되어 201 상태코드 전송
        res.status(201).json(approve);
    } catch (error) {
        console.error(error);
        next(error);
    }
});

//로그인 라우터
router.post('/login', (req, res, next) => {
    console.log('로그인 라우터 호출 됨');
    console.log(req.body);
    passport.authenticate('local', (authError, user, info) => {
        //에러가 있는 경우
        if (authError) {
            console.error(authError);
            return next(authError);
        }
        //사용자 없는 경우 or 비밀번호 다른 경우
        if (!user) {
            console.log(info);
            const approve = { 'approve': info.message };
            return res.json(approve);
        }
        //사용자 존재하는 경우. 
        return req.login(user, async (loginError) => {
            if (loginError) {
                console.error(loginError);
                return next(loginError);
            }

            const user = req.session.passport.user;
            const userInfo = await User.findOne({
                where: { id: user }
            });

            console.log(userInfo.dataValues);
            const approve = { 'approve': 'ok_login', 'user': userInfo.dataValues };
            //로그인 완료되어 user 정보 전송
            res.status(200).json(approve);
        });
    })(req, res, next);
});

//로그아웃 라우터. 로그인 되어 있을 때만 접근 가능.
router.get('/logout', (req, res) => {
    console.log('로그아웃 라우터 호출 됨');
    req.logout();
    req.session.destroy();
    let approve = { 'approve': 'ok' };
    //로그아웃 완료되어 200 상태코드 전송
    res.status(200).json(approve);
})

router.post('/findId', async (req, res) => {
    console.log('아이디 찾기 라우터 호출 됨');
    const email = req.body.email;
    const name = req.body.name;
    try {
        const user = await User.findOne({
            where: {
                email,
                name
            }
        });

        let findId = { "userId": "fail" };
        if (user) {
            findId.userId = user.userId;
            res.status(200).json(findId);
        } else {
            let approve = { 'approve': 'fail' };
            res.status(400).json(approve);
        }
    } catch (err) {
        console.error(err);
        next(err);
    }
});

router.post('/findPw', async (req, res) => {
    console.log('비밀번호 찾기 라우터 호출 됨');
    const userId = req.body.userId;
    const email = req.body.email;
    const name = req.body.name;
    try {
        //받은 정보로 user 찾기
        const user = await User.findOne({
            where: {
                userId,
                email,
                name
            }
        });

        let approve = { 'approve': 'fail' };
        //새 랜덤 비밀번호 발급 
        let tempPw = Math.random().toString(36).substr(2, 11);

        if (user) {
            let emailParam = {
                email: email,
                subject: 'auth check email',
                text: '<p>' + `${userId}` + '님의 비밀번호는' + `${tempPw}` + ' 입니다.</p>'
            };

            //이메일 전송
            mailer.sendGmail(emailParam);

            //임시 비밀번호 암호화
            const hashTemp = await bcrypt.hash(tempPw, 12);
            //임시 비밀번호로 비밀번호 수정
            const result = await sequelize.transaction(async (t) => {
                await User.update(
                    { password: hashTemp },
                    {
                        where: { userId: user.userId }
                    }, { transaction: t });
            });
            approve.approve = 'ok';
            res.status(200).json(approve);
        } else {
            res.status(400).json(approve);
        }
    } catch (err) {
        console.error(err);
        next(err);
    }
});

module.exports = router;