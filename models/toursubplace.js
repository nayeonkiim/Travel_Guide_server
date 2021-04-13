const Sequelize = require('sequelize');

module.exports = class TourSubPlace extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            name: {
                type: Sequelize.STRING(50),
                allowNull: false
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
            modelName: 'TourSubPlace',
            tableName: 'toursubplaces',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
        });
    }

    static associate(db) {
        db.TourSubPlace.belongsTo(db.TourPlace);
        db.TourSubPlace.belongsToMany(db.Location, { through: db.TourSubLocation });
        db.TourSubPlace.hasMany(db.TourSubLocation);
    }
}