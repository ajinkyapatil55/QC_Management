// use to live server with PM2...
// app.js

const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const ownerRoutes = require("./routes/ownerRoutes");

const app = express();

/* ==========================================
   Middleware
========================================== */
app.use(cors());

// Increase the limit for JSON payloads (e.g., to 50 Megabytes)
app.use(express.json({ limit: "50mb" }));

// Increase the limit for URL-encoded payloads (e.g., to 50 Megabytes)
app.use(express.urlencoded({ limit: "50mb", extended: true }));

/* ==========================================
   Static Files
========================================== */
const distPath = path.join(__dirname, "../dist");
const uploadsPath = path.join(__dirname, "uploads");

console.log("Frontend Path:", distPath);
console.log("Uploads Path:", uploadsPath);

// Serve React Build & Uploads first so they don't conflict with API routes
app.use(express.static(distPath));
app.use("/uploads", express.static(uploadsPath));

/* ==========================================
   API Routes
========================================== */
app.use("/api", authRoutes);
app.use(ownerRoutes);

/* ==========================================
   React SPA Fallback
========================================== */
// Standard fallback middleware that avoids path strings entirely
app.use((req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

module.exports = app;























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

















// use to local server ...

// const express = require("express");
// const cors = require("cors");
// const authRoutes = require("./routes/authRoutes");
// const ownerRoutes = require("./routes/ownerRoutes");

// const app = express();

// // CORS configuration
// app.use(cors({
//   origin: "http://localhost:5173", // your frontend URL 
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
//   credentials: true // allow sending auth headers
// }));

// app.use(express.json());

// // === Serve uploaded images ===
// const path = require("path");
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// // Routes
// app.use("/api", authRoutes);
// app.use(ownerRoutes);

// module.exports = app;




// // use to local server ...

// const express = require("express");
// const cors = require("cors");
// const authRoutes = require("./routes/authRoutes");
// const ownerRoutes = require("./routes/ownerRoutes");
// const path = require("path"); // Moved imports to the top for clean structure

// const app = express();

// // ================= CRITICAL FIX: LARGE PAYLOAD PARSERS =================
// // Replaced your default app.use(express.json()) with large 50mb capacity configurations
// app.use(express.json({ limit: "50mb" }));
// app.use(express.urlencoded({ extended: true, limit: "50mb" }));
// // =======================================================================

// // CORS configuration
// app.use(cors({
//   origin: "http://localhost:5173", // your frontend URL 
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
//   credentials: true // allow sending auth headers
// }));

// // === Serve uploaded images ===
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// // Routes
// app.use("/api", authRoutes);
// app.use(ownerRoutes);

// module.exports = app;