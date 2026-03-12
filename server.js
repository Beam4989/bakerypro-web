const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));

app.set("view engine", "ejs");

app.use("/", require("./routes/products"));
app.use("/", require("./routes/categories"));
app.use("/", require("./routes/ingredients"));
app.use("/", require("./routes/recipes"));
app.use("/", require("./routes/batches"));
app.use("/", require("./routes/ingredientMovements"));
app.use("/", require("./routes/actions"));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});