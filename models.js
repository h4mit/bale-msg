const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// اتصال به دیتابیس SQLite
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'database.sqlite'),
});

// تعریف مدل Bot
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

// همگام‌سازی مدل با دیتابیس
sequelize.sync();

module.exports = {
    sequelize,
    Bot,
};