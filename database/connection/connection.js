const Sequelize = require('sequelize')

const connection = new Sequelize('database', 'YinYue', process.env.DB_PASS, {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	// SQLite only
	storage: './database/db.sqlite',
});

module.exports = {connection};

