const router = require("express").Router();
const { query } = require("../db");

router.get("/batches", async (req, res) => {

  const rs = await query(`
    SELECT b.*, p."ProductName"
    FROM "ProductBatch" b
    JOIN "Product" p
    ON p."ProductId" = b."ProductId"
  `);

  res.render("batches/list", {
    rows: rs.rows
  });

});

module.exports = router;