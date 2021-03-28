const Sequelize = require('sequelize');

module.exports = class User extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            userId: {
                type: Sequelize.STRING(40),
                allowNull: true,
                unique: true,
            },
            password: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },
            name: {
                type: Sequelize.STRING(15),
                allowNull: false,
            },
            email: {
                type: Sequelize.STRING(40),
                allowNull: false,
                unique: true,
            },
            birth: {
                type: Sequelize.STRING(6),
                allowNull: false,
            },
            gender: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
            },
            role: {
                type: Sequelize.STRING(10),
                allowNull: false,
            },
        }, {
            sequelize,
            timestamps: false,
            underscored: false,
            modelName: 'User',
            tableName: 'users',
            paranoid: false,
            charset: 'utf8',
            collate: 'utf8_general_ci',
        });
    }

    static associate(db) {
        db.User.hasMany(db.UserGroup);
        db.User.belongsToMany(db.Group, { through: db.UserGroup });
    }
}