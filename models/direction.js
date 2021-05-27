const Sequelize = require('sequelize');

module.exports = class Direction extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            seq: {
                type: Sequelize.STRING(30),
                allowNull: false,
                unique: true,
            },
            direct: {
                type: Sequelize.STRING(1000),
                allowNull: false
            }
        }, {
            sequelize,
            timestamps: false,
            underscored: false,
            modelName: 'Direction',
            tableName: 'directions',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
        });
    }

    static associate(db) { }
}