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
        });
    }

    static associate(db) {
    }
}