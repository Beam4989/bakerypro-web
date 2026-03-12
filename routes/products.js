const path = require('path');
const fs = require('fs');
const router = require('express').Router();
const upload = require('../upload');
const { ensureRepo, commitAdd, commitRemove, toRawUrl, REPO_DIR } = require('../git');
const { v4: uuidv4 } = require('uuid');
const mime = require('mime-types');
const supabase = require('../supabase');


// ======================
// LIST PRODUCTS
// ======================
router.get('/products', async (req, res) => {

  const { data, error } = await supabase
    .from('Product')
    .select(`
      ProductId,
      ProductName,
      CategoryId,
      ShelfLifeDays,
      UnitPrice,
      ProductReorderPoint,
      ImgProduct,
      Categories(CategoryName)
    `)
    .order('ProductId');

  if (error) {
    console.error(error);
    return res.status(500).send(error.message);
  }

  const rows = (data || []).map(p => ({
    ...p,
    CategoryName: p.Categories?.CategoryName
  }));

  res.render('products/list', { rows });

});


// ======================
// NEW PRODUCT FORM
// ======================
router.get('/products/new', async (req, res) => {

  const { data } = await supabase
    .from('Categories')
    .select('CategoryId, CategoryName')
    .order('CategoryName');

  res.render('products/form', {
    row: {},
    cats: data || [],
    mode: 'create'
  });

});


// ======================
// CREATE PRODUCT
// ======================
router.post('/products', upload.single('ImgProductFile'), async (req, res) => {

  const {
    ProductName,
    CategoryId,
    ShelfLifeDays,
    UnitPrice,
    ProductReorderPoint
  } = req.body;

  if (!req.file) {
    return res.status(400).send('Image file is required.');
  }

  const ext = mime.extension(req.file.mimetype) || 'jpg';
  const fileName = `${uuidv4()}.${ext}`;

  const relPath = path.posix.join('products', fileName);
  const absPath = path.join(REPO_DIR, relPath);

  try {

    await ensureRepo();

    fs.mkdirSync(path.dirname(absPath), { recursive: true });

    fs.writeFileSync(absPath, req.file.buffer);

    await commitAdd(relPath, `Add product image ${fileName}`);

    const imgUrl = toRawUrl(relPath);

    const { error } = await supabase
      .from('Product')
      .insert([
        {
          ProductName,
          CategoryId,
          ShelfLifeDays,
          UnitPrice: UnitPrice || 0,
          ProductReorderPoint,
          ImgProduct: imgUrl
        }
      ]);

    if (error) throw error;

    res.redirect('/products');

  } catch (e) {

    console.error(e);
    res.status(500).send('Upload failed.');

  }

});


// ======================
// EDIT PRODUCT FORM
// ======================
router.get('/products/:id/edit', async (req, res) => {

  const { data: cats } = await supabase
    .from('Categories')
    .select('CategoryId, CategoryName')
    .order('CategoryName');

  const { data } = await supabase
    .from('Product')
    .select('*')
    .eq('ProductId', req.params.id)
    .single();

  res.render('products/form', {
    row: data,
    cats: cats || [],
    mode: 'edit'
  });

});


// ======================
// UPDATE PRODUCT
// ======================
router.put('/products/:id', upload.single('ImgProductFile'), async (req, res) => {

  const {
    ProductName,
    CategoryId,
    ShelfLifeDays,
    UnitPrice,
    ProductReorderPoint
  } = req.body;

  const id = parseInt(req.params.id);

  const { data: cur } = await supabase
    .from('Product')
    .select('ImgProduct')
    .eq('ProductId', id)
    .single();

  let imgUrl = cur?.ImgProduct;

  try {

    if (req.file) {

      if (imgUrl) {

        const relOld = imgUrl.split('/').slice(7).join('/');

        const absOld = path.join(REPO_DIR, relOld);

        if (fs.existsSync(absOld)) {
          await commitRemove(relOld, `Remove product old image ${relOld}`);
        }

      }

      const ext = mime.extension(req.file.mimetype) || 'jpg';

      const fileName = `${uuidv4()}.${ext}`;

      const relPath = path.posix.join('products', fileName);
      const absPath = path.join(REPO_DIR, relPath);

      fs.mkdirSync(path.dirname(absPath), { recursive: true });

      fs.writeFileSync(absPath, req.file.buffer);

      await commitAdd(relPath, `Add product image ${fileName}`);

      imgUrl = toRawUrl(relPath);

    }

    const { error } = await supabase
      .from('Product')
      .update({
        ProductName,
        CategoryId,
        ShelfLifeDays,
        UnitPrice: UnitPrice || 0,
        ProductReorderPoint,
        ImgProduct: imgUrl
      })
      .eq('ProductId', id);

    if (error) throw error;

    res.redirect('/products');

  } catch (e) {

    console.error(e);
    res.status(500).send('Update failed.');

  }

});


// ======================
// DELETE PRODUCT
// ======================
router.delete('/products/:id', async (req, res) => {

  const id = parseInt(req.params.id);

  try {

    const { data: cur } = await supabase
      .from('Product')
      .select('ImgProduct')
      .eq('ProductId', id)
      .single();

    const imgUrl = cur?.ImgProduct;

    await supabase
      .from('Recipe')
      .delete()
      .eq('ProductId', id);

    const { error } = await supabase
      .from('Product')
      .delete()
      .eq('ProductId', id);

    if (error) throw error;

    try {

      if (imgUrl) {

        const relOld = imgUrl.split('/').slice(7).join('/');

        await commitRemove(relOld, `Remove product image ${relOld}`);

      }

    } catch (e) {

      console.warn('Image remove warning:', e.message);

    }

    res.redirect('/products');

  } catch (e) {

    console.error(e);
    res.status(500).send('Delete failed.');

  }

});

module.exports = router;