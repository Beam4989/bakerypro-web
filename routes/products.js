const router = require("express").Router();
const { query } = require("../db");

// LIST
router.get("/products", async (req, res) => {

  const rs = await query(`
    SELECT p."ProductId",
           p."ProductName",
           p."CategoryId",
           p."ShelfLifeDays",
           p."UnitPrice",
           p."ProductReorderPoint",
           p."ImgProduct",
           c."CategoryName"
    FROM "Product" p
    JOIN "Categories" c
      ON c."CategoryId" = p."CategoryId"
    ORDER BY p."ProductId"
  `);

  res.render("products/list", {
    rows: rs.rows
  });

});

// CREATE
router.post("/products", async (req, res) => {

  const {
    ProductName,
    CategoryId,
    ShelfLifeDays,
    UnitPrice,
    ProductReorderPoint
  } = req.body;

  await query(
    `INSERT INTO "Product"
    ("ProductName","CategoryId","ShelfLifeDays","UnitPrice","ProductReorderPoint")
    VALUES ($1,$2,$3,$4,$5)`,
    [ProductName, CategoryId, ShelfLifeDays, UnitPrice, ProductReorderPoint]
  );

  res.redirect("/products");

});

// DELETE
router.get("/products/delete/:id", async (req, res) => {

  await query(
    `DELETE FROM "Product"
     WHERE "ProductId"=$1`,
    [req.params.id]
  );

  res.redirect("/products");

});

module.exports = router;