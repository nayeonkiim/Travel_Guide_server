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
    let approve = { 'approve': 'fail' };
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
                        approve.approve = 'ok_groupCreate';
                        //멤버 정상적으로 추가 완료
                        res.json(approve);
                    } catch (err) {
                        //에러가 있는 경우 rollback
                        await t.rollback();
                        console.error(err);
                        next(err);
                    }
                } else {
                    approve.approve = 'fail';
                    res.status(409).json(approve);
                }
            });

    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.get("/idCheck/:userId", async (req, res, next) => {
    console.log('멤버 아이디 체크 라우터 호출됨');
    const userIdparam = req.params.userId;

    try {
        //userId 에 해당하는 멤버 있는지 조회
        const result = await User.findOne({ where: { userId: userIdparam } })
            .then(result => {
                let approve = { "approve": "fail_groupIdChk" };
                if (result) {
                    approve.approve = "ok_groupIdChk";
                    //멤버 있는 경우
                    res.status(200).json(approve);
                } else {
                    //멤버 없는 경우
                    approve.approve = "fail_groupIdChk";
                    //status(400) 으로 보내면 에러 메시지 안감
                    //res.status(401).json(approve); 
                    res.json(approve);
                }
            });
    } catch (err) {
        console.error(err);
        next(err);
    }
});

//가이드의 그룹 조회 
router.get("/:userId", async (req, res, next) => {
    console.log('가이드의 그룹 조회 라우터 호출됨');
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
                    const message = { 'approve': 'ok_group', 'group': groups };
                    console.log(message);
                    return res.status(200).json(message);
                })
                .catch(err => {
                    console.log(err);
                    next(err);
                })
        } else {
            //가이드가 아닌 경우
            const message = { 'approve': '가이드가 아닙니다.' };
            return res.status(500).json(message);
        }
    } else {
        //그룹이 없는 경우
        const message = { 'approve': '그룹이 존재하지 않습니다.' };
        return res.status(500).json(message);
    }
});


// 그룹 구성원 조회
router.get("/member/:title", async (req, res, next) => {
    console.log('그룹 구성원 조회 라우터 호출됨');
    const title = req.params.title;

    try {
        //title로 groupId 구하기
        const groupId = await Group.findOne({
            where: { title }
        })
            .then(async (groupId) => {
                if (groupId) {
                    const users = await groupId.getUsers({
                        attributes: ['userId']
                    })
                        .then(users => {
                            let approve = { "approve": "ok_mem_receive", "userMem": users }
                            if (users.length > 0) {
                                console.log('그룹 멤버 조회 성공');
                                res.status(200).json(approve);
                            } else {
                                console.log('그룹 멤버 조회 실패');
                                approve.approve = "fail_noGroupMember";
                                approve.userMem = "noMember";
                                res.status(500).json(approve);
                            }
                        })
                } else {
                    console.log(groupId + ' is null');
                }
            })
            .catch(err => {
                const approve = { 'approve': '존재하지 않는 그룹명 입니다.' };
                console.log(approve.approve);
                return res.status(500).json(approve);
            })
    } catch (err) {
        console.error(err);
        next(err);
    }
});


router.get('/myGroup/:userId', async (req, res, next) => {
    console.log('멤버 한명 그룹 조회 라우터 호출됨');
    const userId = req.params.userId;
    try {
        const user = await User.findOne({
            where: { userId }
        });
        console.log(user);

        //user 가 포함된 group 정보들 조회
        let mygroup = await Group.findAll({
            include: [{
                model: UserGroup,
                where: { UserId: user.id },
            }],
            attributes: ['title'],
            raw: true
        });
        mygroup = mygroup.map(el => el.title);
        console.log(mygroup);

        //그룹 갯수가 하나이상이면 그룹 정보 보내주기
        if (mygroup.length > 0) {
            let approve = { 'approve': 'ok', 'group': mygroup };
            res.status(200).json(approve);
        }
        //그룹 갯수 없는 경우 
        else {
            let approve = { 'approve': 'fail_nogroup' };
            res.status(500).json(approve);
        }

    } catch (err) {
        console.error(err);
        next();
    }
});

module.exports = router;