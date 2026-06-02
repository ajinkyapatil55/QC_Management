// use to live server with PM2...

const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const ownerRoutes = require("./routes/ownerRoutes");

const app = express();

/* ==========================================
   1. Global Middleware
========================================== */
app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ==========================================
   2. API & Business Logic Routes
========================================== */
app.use("/api", authRoutes);
app.use(ownerRoutes);

/* ==========================================
   3. Static Folders (React Build & Media Uploads)
========================================== */
// Serves frontend static files from the root dist folder
const distPath = path.join(__dirname, "../dist"); 
app.use(express.static(distPath));

// FIX: Points directly to E:\Rent_NodeJs\Rent_NodeJs\src\uploads
const uploadsPath = path.join(__dirname, "./uploads");
app.use("/uploads", express.static(uploadsPath));

// Verification logs for PM2 startup
console.log(" -> [Static Frontend] Serving from:", distPath);
console.log(" -> [Uploaded Images] Serving from:", uploadsPath);

/* ==========================================
   4. Crash-Proof Catch-All Middleware
========================================== */
app.use((req, res, next) => {
  if (req.url.startsWith("/api") || /\.(png|jpg|jpeg|gif|svg|ico|css|js|woff2?)$/i.test(req.url)) {
    return res.status(404).send("Requested asset or endpoint not found");
  }

  if (req.method === "GET") {
    return res.sendFile(path.join(distPath, "index.html"));
  }

  next();
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




// use to local server ...

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