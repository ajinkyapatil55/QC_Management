// src/controllers/reportqcController.js

const db = require("../config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ========================= MULTER CONFIG =========================

// Make sure "uploads" folder exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${file.fieldname}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({ storage });

// ========================= SAVE QC DEFECT =========================
exports.saveQCDefect = [
  upload.single("image"), // Accept a single file named 'image'
  async (req, res) => {
    try {
      // console.log("REQ.BODY:", req.body);
      // console.log("REQ.FILE:", req.file);

      const { addqc_id, defect_name, qty, defect_type } = req.body;

      if (!addqc_id || !defect_name || !qty) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const newQty = Number(qty);

      // 1️⃣ Get partName and allowed total
      const [qcRows] = await db.query(
        `SELECT partName, reworkQty, rejectedQty FROM addqc WHERE id = ?`,
        [addqc_id]
      );

      if (!qcRows.length) {
        return res.status(404).json({ message: "QC entry not found" });
      }

      const partName = qcRows[0].partName;
      const allowed = Number(qcRows[0].reworkQty || 0) + Number(qcRows[0].rejectedQty || 0);

      // 2️⃣ Get already used qty
      const [sumRows] = await db.query(
        `SELECT COALESCE(SUM(qty),0) AS used FROM reportqc WHERE addqc_id = ?`,
        [addqc_id]
      );

      const used = Number(sumRows[0].used || 0);
      const remaining = allowed - used;

      // 3️⃣ Validate quantity
      if (newQty > remaining) {
        return res.status(400).json({ message: `Only ${remaining} quantity remaining` });
      }

      // 4️⃣ Insert defect
      const image_url = req.file ? req.file.filename : null;

      await db.query(
        `INSERT INTO reportqc (addqc_id, partName, defect_name, qty,defect_type, image_url)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [addqc_id, partName, defect_name, newQty, defect_type, image_url]
      );

      res.status(200).json({ message: "Saved Successfully" });
    } catch (error) {
      console.error("Save QC Defect Error:", error);
      res.status(500).json({ message: error.message });
    }
  },
];

// ========================= UPDATE QC DEFECT =========================
exports.updateQCDefect = [
  upload.single("image"),
  async (req, res) => {
    try {
      const { id, addqc_id, defect_name, qty, defect_type } = req.body;

      if (!id || !addqc_id || !defect_name || !qty) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const newQty = Number(qty);

      // 1️⃣ Get allowed total
      const [qcRows] = await db.query(
        `SELECT (reworkQty + rejectedQty) AS allowed FROM addqc WHERE id = ?`,
        [addqc_id]
      );

      if (!qcRows.length) {
        return res.status(404).json({ message: "QC entry not found" });
      }

      const allowed = Number(qcRows[0].allowed);

      // 2️⃣ Get used qty excluding this defect
      const [sumRows] = await db.query(
        `SELECT COALESCE(SUM(qty),0) AS used FROM reportqc WHERE addqc_id = ? AND id != ?`,
        [addqc_id, id]
      );

      const used = Number(sumRows[0].used);
      const remaining = allowed - used;

      if (newQty > remaining) {
        return res.status(400).json({ message: `Only ${remaining} quantity allowed` });
      }

      // 3️⃣ Update defect
      const image_url = req.file ? req.file.filename : null;

      if (image_url) {
        await db.query(
          `UPDATE reportqc SET defect_name = ?, qty = ?, defect_type = ?, image_url = ? WHERE id = ?`,
          [defect_name, newQty, defect_type, image_url, id]
        );
      } else {
        await db.query(
          `UPDATE reportqc SET defect_name = ?, qty = ?, defect_type = ? WHERE id = ?`,
          [defect_name, newQty, defect_type, id]
        );
      }

      res.status(200).json({ message: "Updated Successfully" });
    } catch (error) {
      console.error("Update QC Defect Error:", error);
      res.status(500).json({ message: "Server Error" });
    }
  },
];

// ========================= DELETE QC DEFECT =========================
exports.deleteQCDefect = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) return res.status(400).json({ message: "ID is required" });

    await db.query(`DELETE FROM reportqc WHERE id = ?`, [id]);

    res.status(200).json({ message: "Deleted Successfully" });
  } catch (error) {
    console.error("Delete QC Defect Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ========================= GET QC DEFECTS BY ADDQC =========================
exports.getQCDefectsByAddqcId = async (req, res) => {
  try {
    const { addqc_id } = req.params;

    if (!addqc_id) return res.status(400).json({ message: "AddQC ID is required" });

    const [rows] = await db.query(
      `SELECT id, addqc_id, partName, defect_name, qty, defect_type, image_url, created_at, updated_at
       FROM reportqc
       WHERE addqc_id = ?
       ORDER BY id ASC`,
      [addqc_id]
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error("Get QC Defects by AddQC ID Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ========================= GET ALL DEFECTS =========================
exports.getAllDefects = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, defect_name FROM defects ORDER BY defect_name ASC`
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error("Get Defects Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ========================= GET ALL ADDQC =========================
exports.getAllAddQC = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, partName, shift, location, inspectedQty, acceptedQty,
             reworkQty, rejectedQty,
             (acceptedQty + reworkQty + rejectedQty) AS total,
             inspectorName, created_at
      FROM addqc
      ORDER BY id DESC
    `);

    res.status(200).json(rows);
  } catch (error) {
    console.error("Fetch AddQC Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};