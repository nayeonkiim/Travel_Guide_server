const Sequelize = require('sequelize');

module.exports = class TourPlace extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            name: {
                type: Sequelize.STRING(50),
                allowNull: false
            },
            address: {
                type: Sequelize.STRING(80),
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
            modelName: 'TourPlace',
            tableName: 'tourplaces',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
        });
    }

    static associate(db) {
        db.TourPlace.hasMany(db.TourLocation);
        db.TourPlace.belongsToMany(db.Location, { through: db.TourLocation });
        db.TourPlace.hasMany(db.TourSubPlace);
        db.TourPlace.hasMany(db.Route);
    }
}