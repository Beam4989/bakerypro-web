const router = require("express").Router();
const { query } = require("../db");

router.get("/recipes", async (req, res) => {

  const rs = await query(`
    SELECT r.*, p."ProductName", i."IngredientName"
    FROM "Recipe" r
    JOIN "Product" p ON p."ProductId" = r."ProductId"
    JOIN "Ingredient" i ON i."IngredientId" = r."IngredientId"
  `);

  res.render("recipes/list", {
    rows: rs.rows
  });

});

module.exports = router;