const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'database.sqlite'),
});

const Bot = sequelize.define('Bot', {
    uuid: {
        type: DataTypes.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
    },
    name: DataTypes.STRING,
    token: DataTypes.STRING,
    return_url: DataTypes.STRING,
});

sequelize.sync();

module.exports = {
    sequelize,
    Bot,
};