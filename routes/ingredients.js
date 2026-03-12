// routes/ingredients.js
const path = require('path');
const fs = require('fs');
const router = require('express').Router();
const supabase = require('../supabase');
const upload = require('../upload');
const { ensureRepo, commitAdd, commitRemove, toRawUrl, REPO_DIR } = require('../git');
const { v4: uuidv4 } = require('uuid');
const mime = require('mime-types');


// =====================
// LIST INGREDIENTS
// =====================
router.get('/ingredients', async (req, res) => {

  const { data } = await supabase
    .from('Ingredient')
    .select(`
      IngredientId,
      IngredientName,
      IngredientUnitName,
      IngredientStockQty,
      IngredientReorderPoint,
      ImgIngredient
    `)
    .order('IngredientId');

  // เรียก function IsLowStock
  const rows = await Promise.all((data || []).map(async (r) => {

    const { data: low } = await supabase
      .rpc('IsLowStock', { p_ingredientid: r.IngredientId });

    return {
      ...r,
      IsLow: low
    };
  }));

  res.render('ingredients/list', { rows });

});


// =====================
// NEW FORM
// =====================
router.get('/ingredients/new', (req, res) => {

  res.render('ingredients/form', {
    row: {},
    mode: 'create'
  });

});


// =====================
// CREATE INGREDIENT
// =====================
router.post('/ingredients', upload.single('ImgIngredientFile'), async (req, res) => {

  const {
    IngredientName,
    IngredientUnitName,
    IngredientStockQty,
    IngredientReorderPoint
  } = req.body;

  if (!req.file) {
    return res.status(400).send('Image file is required.');
  }

  const ext = mime.extension(req.file.mimetype) || 'jpg';
  const fileName = `${uuidv4()}.${ext}`;

  const relPath = path.posix.join('ingredients', fileName);
  const absPath = path.join(REPO_DIR, relPath);

  try {

    await ensureRepo();

    fs.mkdirSync(path.dirname(absPath), { recursive: true });

    fs.writeFileSync(absPath, req.file.buffer);

    await commitAdd(relPath, `Add ingredient image ${fileName}`);

    const imgUrl = toRawUrl(relPath);

    await supabase
      .from('Ingredient')
      .insert([{
        IngredientName,
        IngredientUnitName,
        IngredientStockQty: IngredientStockQty || 0,
        IngredientReorderPoint: IngredientReorderPoint || 0,
        ImgIngredient: imgUrl
      }]);

    res.redirect('/ingredients');

  } catch (err) {

    console.error(err);

    res.status(500).send('Upload failed.');

  }

});


// =====================
// EDIT FORM
// =====================
router.get('/ingredients/:id/edit', async (req, res) => {

  const { data } = await supabase
    .from('Ingredient')
    .select('*')
    .eq('IngredientId', req.params.id)
    .single();

  res.render('ingredients/form', {
    row: data,
    mode: 'edit'
  });

});


// =====================
// UPDATE INGREDIENT
// =====================
router.put('/ingredients/:id', upload.single('ImgIngredientFile'), async (req, res) => {

  const id = parseInt(req.params.id, 10);

  const {
    IngredientName,
    IngredientUnitName,
    IngredientStockQty,
    IngredientReorderPoint
  } = req.body;

  const { data: cur } = await supabase
    .from('Ingredient')
    .select('ImgIngredient')
    .eq('IngredientId', id)
    .single();

  let imgUrl = cur?.ImgIngredient;

  try {

    if (req.file) {

      if (imgUrl) {

        const relOld = imgUrl.split('/').slice(7).join('/');

        await commitRemove(relOld, `Remove ingredient old image ${relOld}`);

      }

      const ext = mime.extension(req.file.mimetype) || 'jpg';

      const fileName = `${uuidv4()}.${ext}`;

      const relPath = path.posix.join('ingredients', fileName);
      const absPath = path.join(REPO_DIR, relPath);

      fs.mkdirSync(path.dirname(absPath), { recursive: true });

      fs.writeFileSync(absPath, req.file.buffer);

      await commitAdd(relPath, `Add ingredient image ${fileName}`);

      imgUrl = toRawUrl(relPath);

    }

    await supabase
      .from('Ingredient')
      .update({
        IngredientName,
        IngredientUnitName,
        IngredientStockQty,
        IngredientReorderPoint,
        ImgIngredient: imgUrl
      })
      .eq('IngredientId', id);

    res.redirect('/ingredients');

  } catch (err) {

    console.error(err);

    res.status(500).send('Update failed.');

  }

});


// =====================
// DELETE INGREDIENT
// =====================
router.delete('/ingredients/:id', async (req, res) => {

  const id = parseInt(req.params.id, 10);

  try {

    const { data: cur } = await supabase
      .from('Ingredient')
      .select('ImgIngredient')
      .eq('IngredientId', id)
      .single();

    const imgUrl = cur?.ImgIngredient;

    // ลบ recipe ก่อน
    await supabase
      .from('Recipe')
      .delete()
      .eq('IngredientId', id);

    // ลบ ingredient
    await supabase
      .from('Ingredient')
      .delete()
      .eq('IngredientId', id);

    // ลบรูปภาพจาก repo
    try {

      if (imgUrl) {

        const relOld = imgUrl.split('/').slice(7).join('/');

        await commitRemove(relOld, `Remove ingredient image ${relOld}`);

      }

    } catch (e) {

      console.warn('Image remove warning:', e.message);

    }

    res.redirect('/ingredients');

  } catch (err) {

    console.error(err);

    res.status(500).send('Delete failed.');

  }

});

module.exports = router;