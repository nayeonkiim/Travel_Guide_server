const Sequelize = require('sequelize');

module.exports = class Manager extends Sequelize.Model {
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
            modelName: 'Manager',
            tableName: 'managers',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
        });
    }

    static associate(db) {
        db.Manager.belongsTo(db.Group);
    }
}