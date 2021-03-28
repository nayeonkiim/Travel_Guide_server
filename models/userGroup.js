const Sequelize = require('sequelize');

module.exports = class UserGroup extends Sequelize.Model {
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
            modelName: 'UserGroup',
            tableName: 'usergroups',
            paranoid: false,
            charset: 'utf8',
            collate: 'utf8_general_ci',
        });
    }

    static associate(db) {
        db.UserGroup.belongsTo(db.User);
        db.UserGroup.belongsTo(db.Group);
    }
}