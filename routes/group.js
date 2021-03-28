const express = require('express');
const Group = require('../models/group');
const User = require('../models/user');
const UserGroup = require('../models/userGroup');
const router = express.Router();
const { sequelize } = require('../models');


//그룹 생성
//매니저 권한인 경우만 그룹 생성하도록 수정
router.post('/', async (req, res, next) => {
    console.log('그룹 생성하기 라우터 호출됨');
    console.log(req.body);
    const manager = req.body.manager;
    const title = req.body.title;
    let approve = { "approve": "fail" };
    try {
        //그룹 이름 조회
        const groupName = await Group.findAll({
            where: { title }
        })
            .then(async (groupName) => {
                //그룹 이름 없는 경우
                if (groupName.length == 0) {
                    //트랜잭션 안에서 실행
                    const t = await sequelize.transaction();

                    try {
                        //그룹 생성
                        const newGroup = await Group.create({
                            title,
                        }, { transaction: t });

                        //매니저를 그룹 소속으로 넣기
                        const user = await User.findOne({ where: { userId: manager } });
                        await newGroup.addUser(user, { transaction: t });

                        //멤버추가하기
                        try {
                            console.log('멤버 추가 시작');
                            const userId = req.body.userId;
                            //, 를 기준으로 멤버 분리
                            let addMem = userId.split(',');
                            const leng = addMem.length;
                            console.log(addMem);

                            //멤버 한명씩 그룹에 넣어주기
                            for (var i = 0; i < leng; i++) {
                                console.log(addMem[i]);
                                let user2 = await User.findOne({ where: { userId: addMem[i] } });
                                //존재하는 멤버인 경우
                                if (user2)
                                    await newGroup.addUser(user2, { transaction: t });
                                else {
                                    //존재하지 않는 멤버의 경우
                                    console.log('없는 멤버');
                                    await t.rollback();
                                    approve.approve = '없는 멤버 입니다.';
                                    return res.status(401).json(approve);
                                }
                            }
                        } catch (err) {
                            console.error(err);
                            next(err);
                        }
                        await t.commit();
                        approve.approve = 'ok';
                        //멤버 정상적으로 추가 완료
                        return res.json(approve);
                    } catch (err) {
                        //에러가 있는 경우 rollback
                        await t.rollback();
                        console.error(err);
                        next(err);
                    }
                } else {
                    approve.approve = '이미 존재하는 그룹명 입니다.';
                    return res.status(409).json(approve);
                }
            });

    } catch (error) {
        console.error(error);
        next(error);
    }
});


//가이드의 그룹 조회 
router.get("/:userId", async (req, res, next) => {
    const userId = req.params.userId;
    //가이드 그룹 조회
    const result = await User.findOne({
        where: { userId }
    });

    let groups = [];
    //가이드인 경우
    if (result) {
        if (result.dataValues.role == 'manager') {
            console.log('i am manager');
            groups = await result.getGroups({
                attributes: ['title'],
                raw: true
            })
                .then(groups => {
                    console.log(groups);
                    return res.status(200).json(groups);
                })
                .catch(err => {
                    console.log(err);
                    next(err);
                })
        } else {
            //가이드가 아닌 경우
            const message = { 'approve': '가이드가 아닙니다.' };
            return res.status(401).json(message);
        }
    } else {
        //그룹이 없는 경우
        const message = { 'approve': '그룹이 존재하지 않습니다.' };
        return res.status(403).json(message);
    }
});


// 그룹 구성원 조회
router.get("/member/:title", async (req, res, next) => {
    const title = req.params.title;

    try {
        //title로 groupId 구하기
        const groupId = await Group.findOne({
            where: { title }
        })
            .then(async (groupId) => {
                if (!groupId) {
                    const users = await groupId.getUsers({
                        attributes: ['userId']
                    })
                        .then(userId => {
                            if (users.length > 0)
                                return res.status(200).json(users);
                        })
                }
            })
            .catch(err => {
                const approve = { 'approve': '존재하지 않는 그룹명 입니다.' };
                return res.status(500).json(approve);
            })
    } catch (err) {
        console.error(err);
        next(err);
    }
});


//공지사항 목록
router.get("/notice/:title", async (req, res, next) => {
    console.log('그룹 생성하기 라우터 호출됨');
    const groupTitle = req.params.title;
    try {
        const result = await Group.findOne({
            where: { title: groupTitle }
        });
        const re = await result.getNotices({
            attributes: ['title'],
            raw: true
        });
        console.log(re);

        if (re.length > 0) {
            return res.status(200).json(re);
        } else {
            const message = { 'approve': '공지글이 존재하지 않습니다.' };
            return res.status(401).json(message);
        }
    } catch (err) {
        console.error(err);
        next(err);
    }
});

//공지사항 글 조회
router.get("/notice/:title", (req, res, next) => {
    console.log('공지사항 글 조회 라우터 호출됨');
});

//공지사항 글 작성
router.post("/notice/:title", (req, res, next) => {
    console.log('공지사항 글 작성 라우터 호출됨');
    const body = req.body;
    try {

    } catch (err) {
        console.error(err);
        next(err);
    }
});

//공지사항 글 수정


//멤버 위치 조회
router.get('/location', async (req, res, next) => {
    const title = req.body.title;
    const userId = req.body.userId;
});

module.exports = router;