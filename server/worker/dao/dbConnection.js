/*const mysql = require('promise-mysql');

const dbConfig = {
    user: "serverUser",
    password: "nodejspassword",
    database: "convert_db",
    host: "localhost",
    connectionLimit: 10
}

module.exports = async () => {
    try {
        let pool;
        let con;
        if (pool) con = pool.getConnection();
        else {
            pool = await mysql.createPool(dbConfig);
            con = pool.getConnection();
        }
        return con;
    } catch (ex) {
        throw ex;
    }
}
*/
const { Pool, Client } = require('pg')
const pool = new Pool({
    user: "postgres",
    password: "postgres",
    database: "convert_db",
    host: "localhost",
    connectionLimit: 10,
    port: 5432,
})

module.exports = () => { return pool }
/*
module.exports = async () => {
    await pool.query('SELECT NOW()', (err, res) => {
        if (err) { return console.log(err) }
        console.log("Conected")
    })

    return pool
}

/*
const client = new Client({
    user: "postgres",
    password: "postgres",
    database: "convert_db",
    host: "localhost",
    connectionLimit: 10,
    port: 3211,
})

module.exports = client.connect()
*/