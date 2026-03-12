const router = require('express').Router();
const supabase = require('../supabase');


// ======================
// LIST RECIPES BY PRODUCT
// ======================
router.get('/recipes', async (req, res) => {

  const { data: prods } = await supabase
    .from('Product')
    .select('ProductId, ProductName')
    .order('ProductName');

  const productId = req.query.productId || (prods?.[0]?.ProductId || 0);

  let rows = [];

  if (productId) {

    const { data } = await supabase
      .from('Recipe')
      .select(`
        RecipeId,
        ProductId,
        IngredientId,
        QtyPerUnit,
        Ingredient (
          IngredientName,
          IngredientUnitName
        )
      `)
      .eq('ProductId', productId)
      .order('RecipeId');

    rows = (data || []).map(r => ({
      ...r,
      IngredientName: r.Ingredient?.IngredientName,
      IngredientUnitName: r.Ingredient?.IngredientUnitName
    }));

  }

  const { data: ing } = await supabase
    .from('Ingredient')
    .select('IngredientId, IngredientName')
    .order('IngredientName');

  res.render('recipes/list', {
    rows,
    prods: prods || [],
    ing: ing || [],
    productId
  });

});


// ======================
// ADD INGREDIENT TO RECIPE
// ======================
router.post('/recipes', async (req, res) => {

  const { ProductId, IngredientId, QtyPerUnit } = req.body;

  await supabase
    .from('Recipe')
    .insert([
      {
        ProductId,
        IngredientId,
        QtyPerUnit
      }
    ]);

  res.redirect(`/recipes?productId=${ProductId}`);

});


// ======================
// DELETE RECIPE LINE
// ======================
router.post('/recipes/:id/delete', async (req, res) => {

  const { productId } = req.body;

  await supabase
    .from('Recipe')
    .delete()
    .eq('RecipeId', req.params.id);

  res.redirect(`/recipes?productId=${productId}`);

});


module.exports = router;