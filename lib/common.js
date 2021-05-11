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

//상품의 경로 찾기
exports.routeInfo = async function (id) {
    let totalRoute = [];
    const routeInfo = await Route.findAll({
        where: { ProductId: id },
        raw: true
    }).then(routeInfo => {
        let k = 1;
        let subRoute = [];
        //day 별로 분류해서 배열에 push
        for (let i = 0; i < routeInfo.length; i++) {
            if (routeInfo[i].day == k) {
                subRoute.push(routeInfo[i]);
            } else {
                totalRoute.push(subRoute);
                subRoute = [];
                k += 1;
                subRoute.push(routeInfo[i]);
            }
        }
        totalRoute.push(subRoute);
        return totalRoute;
    });
}