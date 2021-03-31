const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');

const User = require('../models/user');

module.exports = () => {
    passport.use(new LocalStrategy({
        usernameField: 'userId',
        passwordField: 'password'
    }, async (userId, password, done) => {
        try {
            //userId 존재하는지 조회
            const user = await User.findOne({ where: { userId } });
            //존재하면 
            if (user) {
                //db password와 입력 password 비교
                const result = await bcrypt.compare(password, user.password);
                if (result) {
                    //비밀번호도 동일하면 조회한 객체 리턴
                    done(null, user);
                } else {
                    done(null, false, { message: 'fail_pwd' });
                }
            } else {
                done(null, false, { message: 'fail' });
            }
        } catch (error) {
            console.error(error);
            done(error);
        }
    }));
};
