// db.js
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect()
  .then(() => console.log("✅ Connected to Supabase"))
  .catch(err => console.log("❌ Database Error:", err));

async function query(text, params = []) {
  const res = await pool.query(text, params);
  return res;
}

module.exports = { query };