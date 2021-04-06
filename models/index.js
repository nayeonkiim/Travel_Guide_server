const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const User = require('./user');
const Group = require('./group');
const Notice = require('./notice');
const UserGroup = require('./userGroup');
const Token = require('./token');
const Location = require('./location');
const Visit = require('./visit');

const db = {};

const sequelize = new Sequelize(config.database, config.username, config.password, config);

db.sequelize = sequelize;

db.User = User;
db.Group = Group;
db.UserGroup = UserGroup;
db.Notice = Notice;
db.Token = Token;
db.Location = Location;
db.Visit = Visit;

User.init(sequelize);
Group.init(sequelize);
UserGroup.init(sequelize);
Notice.init(sequelize);
Token.init(sequelize);
Location.init(sequelize);
Visit.init(sequelize);

User.associate(db);
Group.associate(db);
UserGroup.associate(db);
Notice.associate(db);
Token.associate(db);
Location.associate(db);
Visit.associate(db);

module.exports = db;

