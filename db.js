// db.js
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect()
  .then(() => console.log("✅ Connected to Supabase PostgreSQL"))
  .catch(err => console.log("❌ Database Error:", err));

async function query(q, params = []) {
  const result = await pool.query(q, params);
  return result;
}

module.exports = { query };