// routes/actions.js
const router = require('express').Router();
const supabase = require('../supabase');


// =====================
// PRODUCE PAGE
// =====================
router.get('/produce', async (req, res) => {

  const { data: prods, error } = await supabase
    .from('Product')
    .select('ProductId, ProductName')
    .order('ProductName');

  res.render('actions/produce', {
    prods: prods || [],
    result: null,
    details: []
  });

});


// =====================
// PRODUCE ACTION
// =====================
router.post('/produce', async (req, res) => {

  const { ProductId, Quantity, ProducedDate } = req.body;

  const { data: prods } = await supabase
    .from('Product')
    .select('ProductId, ProductName')
    .order('ProductName');

  const { data, error } = await supabase
    .rpc('Add_Product', {
      p_productid: ProductId,
      p_quantity: Quantity,
      p_produceddate: ProducedDate
    });

  const result = data?.[0] || null;
  const details = data?.[1] || [];

  res.render('actions/produce', {
    prods: prods || [],
    result,
    details
  });

});


// =====================
// REFILL PAGE
// =====================
router.get('/refill', async (req, res) => {

  const { data: ing } = await supabase
    .from('Ingredient')
    .select('IngredientId, IngredientName')
    .order('IngredientName');

  res.render('actions/refill', {
    ing: ing || [],
    result: null
  });

});


// =====================
// REFILL ACTION
// =====================
router.post('/refill', async (req, res) => {

  const { IngredientId, Qty, CreatedAt } = req.body;

  const { data: ing } = await supabase
    .from('Ingredient')
    .select('IngredientId, IngredientName')
    .order('IngredientName');

  const { data } = await supabase
    .rpc('RefillIngredient', {
      p_ingredientid: IngredientId,
      p_qty: Qty,
      p_createdat: CreatedAt
    });

  const result = data?.[0] || null;

  res.render('actions/refill', {
    ing: ing || [],
    result
  });

});

module.exports = router;