// routes/batches.js
const router = require('express').Router();
const supabase = require('../supabase');

router.get('/batches', async (req, res) => {

  const { data, error } = await supabase
    .from('ProductBatch')
    .select(`
      ProductBatchId,
      ProductId,
      ProducedDate,
      Quantity,
      ExpiredDate,
      Product(ProductName)
    `)
    .order('ProductBatchId', { ascending: false });

  const rows = (data || []).map(r => ({
    ...r,
    ProductName: r.Product?.ProductName
  }));

  res.render('batches/list', { rows });

});

module.exports = router;