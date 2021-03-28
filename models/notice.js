const Sequelize = require('sequelize');

module.exports = class Notice extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            title: {
                type: Sequelize.STRING(30),
                allowNull: false,
            },
            content: {
                type: Sequelize.STRING(300),
                allowNull: false,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: sequelize.literal('now()'),
            }
        }, {
            sequelize,
            timestamps: false,
            underscored: false,
            modelName: 'Notice',
            tableName: 'notices',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
        });
    }

    static associate(db) {
        db.Notice.belongsTo(db.Group);
    }
};