const Sequelize = require('sequelize');

module.exports = class Time extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            total: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
        }, {
            sequelize,
            timestamps: false,
            underscored: false,
            modelName: 'Time',
            tableName: 'times',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
        });
    }

    static associate(db) {
        db.Time.belongsTo(db.TourSubPlace);
        db.Time.belongsTo(db.User);
    }
}