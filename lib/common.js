const Group = require('../models/group');
const User = require('../models/user');

//그룹 멤버 조회하기
exports.findMem = async function (title) {
    const groupId = await Group.findOne({
        where: { title }
    });
    console.log(groupId);
    //멤버들만 가져오기
    const users = await groupId.getUsers({
        attributes: ['id', 'role', 'userId'],
        raw: true
    });
    return users;
}