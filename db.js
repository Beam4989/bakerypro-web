// db.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ฟังก์ชัน query แบบง่าย (ไว้ใช้แทน query เดิม)
async function query(table, action, data = {}, filter = {}) {

  let q = supabase.from(table);

  if (action === "select") {
    q = q.select(data.columns || "*");

    if (filter.column) {
      q = q.eq(filter.column, filter.value);
    }

    if (data.order) {
      q = q.order(data.order);
    }
  }

  if (action === "insert") {
    q = q.insert(data);
  }

  if (action === "update") {
    q = q.update(data).eq(filter.column, filter.value);
  }

  if (action === "delete") {
    q = q.delete().eq(filter.column, filter.value);
  }

  const { data: result, error } = await q;

  if (error) throw error;

  return result;
}

module.exports = { supabase, query };