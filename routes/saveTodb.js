const express = require('express');
const router = express.Router();
const fs = require('fs');
const TourPlace = require('../models/tourplace');
const Location = require('../models/location');
const User = require('../models/user');
const { Sequelize } = require('sequelize');


router.get('/', async (req, res, next) => {
    const dataBuffer = fs.readFileSync('./lib/data.json')
    const dataJSON = dataBuffer.toString();
    const data = JSON.parse(dataJSON);
    try {
        for (let i = 0; i < data.length; i++) {
            if (data[i].위도 != null && data[i].경도 != null && data[i].위도 != '' && data[i].경도 != '') {
                const insert = await TourPlace.create({
                    name: data[i].관광지명,
                    address: data[i].소재지지번주소,
                    latitude: data[i].위도,
                    longitude: data[i].경도
                });
            } else {
                continue;
            }
        }
        return res.status(200);
    } catch (err) {
        console.error(err);
        next();
    }
});


//경도, 위도 값 하구 날짜 값하고 나이하고 성별, 시간값
router.get('/jsonTocsv', async (req, res, next) => {
    try {
        const userRoutes = await Location.aggregate('UserId', 'DISTINCT', { plain: false });
        //console.log(userRoutes);

        let routeData = [];
        for (let i = 0; i < userRoutes.length; i++) {
            let oneData = [];
            const rr = await Location.findAll({
                where: { UserId: userRoutes[i].DISTINCT },
                attributes: [[Sequelize.fn("concat", Sequelize.col('latitude'), ' ', Sequelize.col('longitude')), 'route']],
                raw: true
            });

            oneData.id = userRoutes[i].DISTINCT
            oneData.routes = rr[0].route;
            for (let j = 1; j < rr.length; j++) {
                oneData.routes += ' -> ' + rr[j].route;
            }
            routeData.push(oneData);
        }
        //user별 이동경로 37.40658535112446 126.74462238872768 -> 37.40709016141241 126.74473362481876 -> ...
        //console.log(routeData);

        console.log(routeData.length);
        for (let k = 0; k < routeData.length; k++) {
            const findOtherData = await Location.findOne({
                include: {
                    model: User,
                    attributes: ['gender', 'birth']
                },
                where: { UserId: routeData[k].id },
                order: ['date', 'UserId', 'time'],
                attributes: ['date', 'time', 'UserId'],
            });

            routeData[k].date = findOtherData.date;
            routeData[k].time = findOtherData.time;
            routeData[k].gender = findOtherData.dataValues.User.gender;
            routeData[k].birth = findOtherData.dataValues.User.birth;
        }

        console.log(routeData);
        const csv_string = jsonToCSV(routeData);
        //json 데이터를 csv로 변경하기
        fs.writeFileSync('routeData.csv', csv_string);

    } catch (error) {
        console.error(error);
        next();
    }
});


//json 데이터 csv로 변경하는 코드
// 코드 https://curryyou.tistory.com/257
function jsonToCSV(json_data) {

    const json_array = json_data;
    //const json_array = JSON.parse(json_data);
    let csv_string = '';
    const titles = Object.keys(json_array[0]);

    titles.forEach((title, index) => { csv_string += (index !== titles.length - 1 ? `${title},` : `${title}\r\n`); }); json_array.forEach((content, index) => {
        let row = '';
        for (let title in content) {
            row += (row === '' ? `${content[title]}` : `,${content[title]}`);
        }
        csv_string += (index !== json_array.length - 1 ? `${row}\r\n` : `${row}`);
    })
    return csv_string;
}

module.exports = router;