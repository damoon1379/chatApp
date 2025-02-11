const {Pool} = require('pg')

const pool = new Pool({
    user: YOUR_USER,
    port: 5432,
    password:YOUR_PASSWORD,
    database:YOUR_DATABASE,
    host:'localhost',
})

module.exports=pool