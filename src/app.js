// const express = require("express");
// const cors = require("cors");
// const path = require("path");

// const authRoutes = require("./routes/authRoutes");
// const ownerRoutes = require("./routes/ownerRoutes");

// const app = express();

// /* =====================
//    Middleware
// ===================== */
// app.use(cors()); // allow cross-origin requests
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// /* =====================
//    API Routes
// ===================== */
// app.use("/api", authRoutes);
// app.use(ownerRoutes);

// /* ===============================
//    Serve React dist
// ================================ */
// const distPath = path.join(__dirname, "../dist");
// app.use(express.static(distPath));

// // Catch-all for React Router
// app.use((req, res) => {
//   res.sendFile(path.join(distPath, "index.html"));
// });  

// module.exports = app;




























// const express = require("express");
// const cors = require("cors");
// const path = require("path");

// const authRoutes = require("./routes/authRoutes");
// const ownerRoutes = require("./routes/ownerRoutes");

// const app = express();

// /* =====================
//    Middleware
// ===================== */
// app.use(cors()); // allow same server requests

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// /* =====================
//    API Routes
// ===================== */
// app.use("/api", authRoutes);
// app.use(ownerRoutes);

// /* ===============================
//    Serve React dist
// ================================ */
// const distPath = path.join(__dirname, "../dist");

// app.use(express.static(distPath));

// // Catch-all for React Router
// app.use((req, res) => {
//   res.sendFile(path.join(distPath, "index.html"));
// });

// app.use("/images", express.static(path.join(__dirname, "assetsthis")));

// module.exports = app;


















const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const ownerRoutes = require("./routes/ownerRoutes");

const app = express();

// CORS configuration
app.use(cors({
  origin: "http://localhost:5173", // your frontend URL
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true // allow sending auth headers
}));

app.use(express.json());

// === Serve uploaded images ===
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api", authRoutes);
app.use(ownerRoutes);

module.exports = app;
