const Sequelize = require('sequelize');

module.exports = class TourLocation extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
        }, {
            sequelize,
            timestamps: false,
            underscored: false,
            modelName: 'TourLocation',
            tableName: 'tourlocations',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
        });
    }

    static associate(db) {
        db.TourLocation.belongsTo(db.TourPlace);
        db.TourLocation.belongsTo(db.Location);
    }
}