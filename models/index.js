const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const User = require('./user');
const Group = require('./group');
const Notice = require('./notice');
const UserGroup = require('./userGroup');
const Token = require('./token');
const Location = require('./location');
const Manager = require('./manager');
const TourPlace = require('./tourplace');
const TourLocation = require('./tourlocation');

const db = {};

const sequelize = new Sequelize(config.database, config.username, config.password, config);

db.sequelize = sequelize;

db.User = User;
db.Group = Group;
db.UserGroup = UserGroup;
db.Notice = Notice;
db.Token = Token;
db.Location = Location;
db.Manager = Manager;
db.TourPlace = TourPlace;
db.TourLocation = TourLocation;

User.init(sequelize);
Group.init(sequelize);
UserGroup.init(sequelize);
Notice.init(sequelize);
Token.init(sequelize);
Location.init(sequelize);
Manager.init(sequelize);
TourPlace.init(sequelize);
TourLocation.init(sequelize);

User.associate(db);
Group.associate(db);
UserGroup.associate(db);
Notice.associate(db);
Token.associate(db);
Location.associate(db);
Manager.associate(db);
TourPlace.associate(db);
TourLocation.associate(db);

module.exports = db;

