const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const User = require('./user');
const Group = require('./group');
const UserGroup = require('./userGroup');
const Token = require('./token');
const Location = require('./location');
const TourPlace = require('./tourplace');
const TourLocation = require('./tourlocation');
const TourSubPlace = require('./toursubplace');
const TourSubLocation = require('./toursublocation');
const Time = require('./time');

const db = {};

const sequelize = new Sequelize(config.database, config.username, config.password, config);

db.sequelize = sequelize;

db.User = User;
db.Group = Group;
db.UserGroup = UserGroup;
db.Token = Token;
db.Location = Location;
db.TourPlace = TourPlace;
db.TourLocation = TourLocation;
db.TourSubPlace = TourSubPlace;
db.TourSubLocation = TourSubLocation;
db.Time = Time;

User.init(sequelize);
Group.init(sequelize);
UserGroup.init(sequelize);
Token.init(sequelize);
Location.init(sequelize);
TourPlace.init(sequelize);
TourLocation.init(sequelize);
TourSubPlace.init(sequelize);
TourSubLocation.init(sequelize);
Time.init(sequelize);

User.associate(db);
Group.associate(db);
UserGroup.associate(db);
Token.associate(db);
Location.associate(db);
TourPlace.associate(db);
TourLocation.associate(db);
TourSubPlace.associate(db);
TourSubLocation.associate(db);
Time.associate(db);

module.exports = db;

