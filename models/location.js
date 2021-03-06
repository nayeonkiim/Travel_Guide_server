
const Sequelize = require('sequelize');

module.exports = class Location extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            date: {
                type: Sequelize.STRING(20),
                allowNull: false,
            },
            time: {
                type: Sequelize.STRING(10),
                allowNull: false,
            },
            latitude: {
                type: Sequelize.DOUBLE,
                allowNull: false,
            },
            longitude: {
                type: Sequelize.DOUBLE,
                allowNull: false,
            }
        }, {
            sequelize,
            timestamps: false,
            underscored: false,
            modelName: 'Location',
            tableName: 'locations',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
        });
    }

    static associate(db) {
        db.Location.belongsTo(db.User);
        db.Location.hasMany(db.TourLocation);
        db.Location.hasMany(db.TourSubLocation);
        db.Location.belongsToMany(db.TourPlace, { through: db.TourLocation });
        db.Location.belongsToMany(db.TourSubPlace, { through: db.TourSubLocation });
    }
}