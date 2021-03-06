const Sequelize = require('sequelize');

module.exports = class Group extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            title: {
                type: Sequelize.STRING(30),
                allowNull: false,
                unique: true,
            },
            startDate: {
                type: Sequelize.DATEONLY,
                allowNull: false,
            },
            endDate: {
                type: Sequelize.DATEONLY,
                allowNull: false,
            },
            manager: {
                type: Sequelize.STRING(10),
                allowNull: false
            }
        }, {
            sequelize,
            timestamps: false,
            underscored: false,
            modelName: 'Group',
            tableName: 'groups',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
        });
    }

    static associate(db) {
        db.Group.hasMany(db.UserGroup);
        db.Group.belongsToMany(db.User, { through: db.UserGroup });
        db.Group.belongsTo(db.Product);
    }
}

// 그룹 만들때 먼저 그룹 이름이 존재하는지 db에서 select
