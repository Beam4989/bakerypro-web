const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
    require: true
  }
});

pool.connect()
  .then(() => console.log("✅ Connected to Supabase"))
  .catch(err => console.log("❌ Database Error:", err));

module.exports = pool;