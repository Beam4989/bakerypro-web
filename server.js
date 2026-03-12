const express = require("express");
const layouts = require("express-ejs-layouts");
const methodOverride = require("method-override");
require("dotenv").config();

require("./db");

const app = express();

app.set("view engine", "ejs");
app.use(layouts);
app.set("layout", "layout");

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static("public"));

app.use("/", require("./routes/categories"));
app.use("/", require("./routes/products"));
app.use("/", require("./routes/ingredients"));
app.use("/", require("./routes/recipes"));
app.use("/", require("./routes/batches"));
app.use("/", require("./routes/actions"));
app.use("/", require("./routes/ingredientMovements"));

app.get("/", (req, res) => {
  res.render("home");
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 BakeryPro web running on http://localhost:${PORT}`);
});