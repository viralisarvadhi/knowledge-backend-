require('dotenv').config();

module.exports = {
    development: {
        username: process.env.DB_USERNAME || 'sarvadhisolution',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'sarvadhisolution',
        host: process.env.DB_HOST || 'localhost',
        dialect: 'postgres',
    },
    test: {
        username: process.env.DB_USERNAME || 'sarvadhisolution',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'sarvadhisolution',
        host: process.env.DB_HOST || 'localhost',
        dialect: 'postgres',
    },
    production: {
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        dialect: 'postgres',
    },
};
