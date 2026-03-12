// routes/ingredientMovements.js
const router = require('express').Router();
const supabase = require('../supabase');

// แปลงค่าหน้า/ขนาดหน้าอย่างปลอดภัย
function toPosInt(v, d) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : d;
}

function toDateOrNull(s) {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : s;
}


// ======================
// LIST + FILTER + PAGINATION
// ======================
router.get('/ingredient-movements', async (req, res) => {

  const { ingredientId, from, to, page, pageSize } = req.query;

  const p = toPosInt(page, 1);
  const ps = toPosInt(pageSize, 20);
  const offset = (p - 1) * ps;

  // dropdown ingredient
  const { data: ing } = await supabase
    .from('Ingredient')
    .select('IngredientId, IngredientName')
    .order('IngredientName');

  let q = supabase
    .from('IngredientMovement')
    .select(`
      IngredientMovementId,
      IngredientId,
      MovementType,
      Qty,
      CreatedAt,
      Ingredient (
        IngredientName,
        IngredientUnitName
      )
    `, { count: 'exact' })
    .order('CreatedAt', { ascending: false })
    .order('IngredientMovementId', { ascending: false })
    .range(offset, offset + ps - 1);

  if (ingredientId) q = q.eq('IngredientId', ingredientId);
  if (toDateOrNull(from)) q = q.gte('CreatedAt', from);
  if (toDateOrNull(to)) q = q.lte('CreatedAt', to);

  const { data, count } = await q;

  const rows = (data || []).map(r => ({
    ...r,
    IngredientName: r.Ingredient?.IngredientName,
    IngredientUnitName: r.Ingredient?.IngredientUnitName
  }));

  const total = count || 0;
  const pages = Math.max(1, Math.ceil(total / ps));

  // summary
  let qs = supabase
    .from('IngredientMovement')
    .select('MovementType, Qty');

  if (ingredientId) qs = qs.eq('IngredientId', ingredientId);
  if (toDateOrNull(from)) qs = qs.gte('CreatedAt', from);
  if (toDateOrNull(to)) qs = qs.lte('CreatedAt', to);

  const { data: sumRows } = await qs;

  let SumIn = 0;
  let SumOut = 0;

  (sumRows || []).forEach(r => {
    if (r.MovementType === 'I') SumIn += Number(r.Qty);
    if (r.MovementType === 'O') SumOut += Number(r.Qty);
  });

  res.render('ingredientMovements/list', {
    rows,
    sums: { SumIn, SumOut },
    ingredients: ing || [],
    filter: {
      ingredientId: ingredientId || '',
      from: from || '',
      to: to || ''
    },
    page: p,
    pageSize: ps,
    total,
    pages
  });

});


// ======================
// EXPORT CSV
// ======================
router.get('/ingredient-movements.csv', async (req, res) => {

  const { ingredientId, from, to } = req.query;

  let q = supabase
    .from('IngredientMovement')
    .select(`
      IngredientMovementId,
      CreatedAt,
      MovementType,
      Qty,
      Ingredient (
        IngredientName,
        IngredientUnitName
      )
    `)
    .order('CreatedAt', { ascending: false })
    .order('IngredientMovementId', { ascending: false });

  if (ingredientId) q = q.eq('IngredientId', ingredientId);
  if (toDateOrNull(from)) q = q.gte('CreatedAt', from);
  if (toDateOrNull(to)) q = q.lte('CreatedAt', to);

  const { data } = await q;

  const rows = (data || []).map(r => ({
    IngredientMovementId: r.IngredientMovementId,
    CreatedAt: r.CreatedAt,
    IngredientName: r.Ingredient?.IngredientName,
    IngredientUnitName: r.Ingredient?.IngredientUnitName,
    MovementType: r.MovementType,
    Qty: r.Qty
  }));

  const header = 'Id,Date,Ingredient,Type,Qty,Unit\r\n';

  const body = rows.map(r =>
    [
      r.IngredientMovementId,
      r.CreatedAt,
      `"${(r.IngredientName || '').replace(/"/g, '""')}"`,
      r.MovementType,
      r.Qty,
      r.IngredientUnitName
    ].join(',')
  ).join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="ingredient-movements.csv"');

  res.send(header + body + '\r\n');

});

module.exports = router;