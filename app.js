const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const nunjucks = require('nunjucks');
const session = require('express-session');
const passport = require('passport');
const http = require('http');
const bodyParser = require('body-parser');

dotenv.config();
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const passportConfig = require('./passport/index');
const { sequelize } = require('./models');  //models/index.js
const groupRouter = require('./routes/group');

const app = express();

passportConfig(); //패스포트 설정
app.set('port', process.env.PORT || 3001);  //8001 포트로 설정 
// app.set('view engine', 'html');
// //views 템플릿으로 nunjucks 사용
// nunjucks.configure('views', {
//     express: app,
//     watch: true,
// });

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,
    cookie: {
        httpOnly: true,
        secure: false,
    },
}));

app.use(passport.initialize());
app.use(passport.session());

//데이터베이스 연결하기
sequelize.sync({ force: false })
    .then(() => {
        console.log('데이터베이스 연결 성공');
    })
    .catch((err) => {
        console.error(err);
    });


app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/group', groupRouter);

//요청을 수신할 때마다 실행
app.use(function (req, res, next) {
    console.log('수신되었습니다.');
    const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
    error.status = 404;
    next(error);
});

//모든 error 여기로
app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = process.env.NODE_ENV !== 'product' ? err : {};
    const approve = { "error": err.message };
    res.status(err.status || 500).send(approve);
});

app.listen(3001, function () {
    console.log("Express server has started on port 80");
});

module.exports = app;