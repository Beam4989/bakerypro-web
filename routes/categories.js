const router = require("express").Router();
const { query } = require("../db");

router.get("/categories", async (req, res) => {

  const rs = await query(`SELECT * FROM "Categories"`);

  res.render("categories/list", {
    rows: rs.rows
  });

});

router.post("/categories", async (req, res) => {

  await query(
    `INSERT INTO "Categories"("CategoryName")
     VALUES ($1)`,
    [req.body.CategoryName]
  );

  res.redirect("/categories");

});

module.exports = router;