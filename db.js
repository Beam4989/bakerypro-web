// db.js
const sql = require('mssql');
require('dotenv').config();

const config = {
  user: "bakeryuser",
  password: "1234",
  server: "localhost",
  database: "BakeryPro",
  options: {
    trustServerCertificate: true
  }
};

sql.connect(config)
  .then(() => console.log("✅ Connected to SQL Server"))
  .catch(err => console.log("❌ Database Connection Error:", err));

module.exports = sql;

const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();

async function query(q, params = []) {
  await poolConnect;
  const r = pool.request();
  params.forEach(p => r.input(p.name, p.type, p.value));
  return r.query(q);
}
async function proc(name, params = []) {
  await poolConnect;
  const r = pool.request();
  params.forEach(p => r.input(p.name, p.type, p.value));
  return r.execute(name);
}
module.exports = { sql, query, proc };
