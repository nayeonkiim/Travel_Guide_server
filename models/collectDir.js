const Sequelize = require('sequelize');

module.exports = class CollectDir extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
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
            modelName: 'CollectDir',
            tableName: 'collectdir',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
        });
    }

    static associate(db) {
    }
}