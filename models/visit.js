const Sequelize = require('sequelize');

module.exports = class Visit extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            date: {
                type: Sequelize.STRING(20),
                allowNull: false,
            },
            latitude: {
                type: Sequelize.DOUBLE,
                allowNull: false,
            },
            longitude: {
                type: Sequelize.DOUBLE,
                allowNull: false,
            },
            age: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            gender: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
            },
        }, {
            sequelize,
            timestamps: false,
            underscored: false,
            modelName: 'Visit',
            tableName: 'visits',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
        });
    }
    static associate(db) {
    }
}