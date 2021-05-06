const Sequelize = require('sequelize');

module.exports = class Route extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            date: {
                type: Sequelize.DATEONLY,
                allowNull: false,
            },
            freeTime: {
                type: Sequelize.BOOLEAN,
                allowNull: false
            }
        }, {
            sequelize,
            timestamps: false,
            underscored: false,
            modelName: 'Route',
            tableName: 'routes',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
        });
    }

    static associate(db) {
        db.Route.belongsTo(db.TourPlace);
        db.Route.belongsTo(db.Group);
    }
}