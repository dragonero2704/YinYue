const Sequelize = require('sequelize')


const connection = new Sequelize('database', 'root', '', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	// SQLite only
	storage: './database/db.sqlite',
});


module.exports = {connection};

