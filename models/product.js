const Sequelize = require('sequelize');

module.exports = class Product extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            title: {
                type: Sequelize.STRING(40),
                allowNull: false,
                unique: true,
            },
            introduce: {
                type: Sequelize.STRING(1000),
                allowNull: true
            },
            memo: {
                type: Sequelize.STRING(800),
                allowNull: true
            }
        }, {
            sequelize,
            timestamps: false,
            underscored: false,
            modelName: 'Product',
            tableName: 'products',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
        });
    }

    static associate(db) {
        db.Product.hasMany(db.Route);
        db.Product.hasMany(db.Group);
    }
}