const Sequelize = require('sequelize');

module.exports = class TourSubLocation extends Sequelize.Model {
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
            modelName: 'TourSubLocation',
            tableName: 'toursublocations',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
        });
    }

    static associate(db) {
        db.TourSubLocation.belongsTo(db.TourSubPlace);
        db.TourSubLocation.belongsTo(db.Location);
    }
}