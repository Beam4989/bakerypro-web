const router = require("express").Router();
const { query } = require("../db");

router.get("/ingredients", async (req, res) => {

  const rs = await query(`SELECT * FROM "Ingredient"`);

  res.render("ingredients/list", {
    rows: rs.rows
  });

});

module.exports = router;