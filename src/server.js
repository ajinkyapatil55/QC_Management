// //live server to use PM2... 


// const path = require("path");
// require("dotenv").config({ path: path.join(__dirname, "../.env") });

// const express = require("express");
// const app = require("./app");

// const PORT = process.env.PORT || 8080;

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });   



const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "./.env") }); // Adjusted to standard root path if .env is next to server.js

const express = require("express");
const app = require("./app");

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});














//local server to use ...


// require("dotenv").config();
// const express = require("express"); // ✅ REQUIRED

// const app = require("./app");

// const PORT = process.env.PORT || 8080;

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

// app.use(express.json({ limit: "50mb" }));
// app.use(express.urlencoded({ extended: true, limit: "50mb" }));
