const Sequelize = require('sequelize');

module.exports = class Token extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            token: {
                type: Sequelize.STRING(1000),
                allowNull: false,
                unique: true,
            }
        }, {
            sequelize,
            timestamps: false,
            underscored: false,
            modelName: 'Token',
            tableName: 'tokens',
            paranoid: false,
            charset: 'utf8',
            collate: 'utf8_general_ci',
        });
    }

    static associate(db) {
        db.Token.belongsTo(db.User);
    }
}