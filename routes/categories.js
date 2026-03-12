// routes/categories.js
const router = require('express').Router();
const supabase = require('../supabase');


// =====================
// LIST CATEGORIES
// =====================
router.get('/categories', async (req, res) => {

  const { data, error } = await supabase
    .from('Categories')
    .select('CategoryId, CategoryName')
    .order('CategoryId');

  if (error) {
    console.error(error);
    return res.status(500).send('Database error');
  }

  res.render('categories/list', { rows: data || [] });

});


// =====================
// CREATE FORM
// =====================
router.get('/categories/new', (req, res) => {

  res.render('categories/form', {
    row: {},
    mode: 'create'
  });

});


// =====================
// CREATE CATEGORY
// =====================
router.post('/categories', async (req, res) => {

  const { CategoryName } = req.body;

  const { error } = await supabase
    .from('Categories')
    .insert([{ CategoryName }]);

  if (error) {
    console.error(error);
    return res.status(500).send('Insert error');
  }

  res.redirect('/categories');

});


// =====================
// EDIT FORM
// =====================
router.get('/categories/:id/edit', async (req, res) => {

  const { data, error } = await supabase
    .from('Categories')
    .select('*')
    .eq('CategoryId', req.params.id)
    .single();

  if (error) {
    console.error(error);
    return res.status(404).send('Category not found');
  }

  res.render('categories/form', {
    row: data,
    mode: 'edit'
  });

});


// =====================
// UPDATE CATEGORY
// =====================
router.put('/categories/:id', async (req, res) => {

  const { error } = await supabase
    .from('Categories')
    .update({ CategoryName: req.body.CategoryName })
    .eq('CategoryId', req.params.id);

  if (error) {
    console.error(error);
    return res.status(500).send('Update error');
  }

  res.redirect('/categories');

});


// =====================
// DELETE CATEGORY
// =====================
router.delete('/categories/:id', async (req, res) => {

  const { error } = await supabase
    .from('Categories')
    .delete()
    .eq('CategoryId', req.params.id);

  if (error) {
    console.error(error);
    return res.status(500).send('Delete error');
  }

  res.redirect('/categories');

});

module.exports = router;