const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const express = require("express");
const app = require("./app");

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});   



















// require("dotenv").config();
// const express = require("express"); // ✅ REQUIRED

// const app = require("./app");

// const PORT = process.env.PORT || 8080;

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

// app.use(express.json({ limit: "50mb" }));
// app.use(express.urlencoded({ extended: true, limit: "50mb" }));
