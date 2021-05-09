const Sequelize = require('sequelize');

module.exports = class Route extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            name: {
                type: Sequelize.STRING(50),
                allowNull: false
            },
            startTime: {
                type: Sequelize.TIME,
                allowNull: false
            },
            endTime: {
                type: Sequelize.TIME,
                allowNull: false
            },
            freeTime: {
                type: Sequelize.BOOLEAN,
                allowNull: false
            },
            day: {
                type: Sequelize.INTEGER.UNSIGNED,
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
        db.Route.belongsTo(db.Product);
        db.Route.belongsTo(db.TourPlace);
    }
}