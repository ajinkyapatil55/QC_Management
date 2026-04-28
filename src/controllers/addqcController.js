const db = require("../config/db");

// ================= SAVE QC =================
exports.saveQC = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    const clientId = req.user?.client_id; // important: must exist
    if (!userId || !clientId) return res.status(401).json({ message: "Unauthorized or client missing" });

    const {
      partName,
      shift,
      location,
      inspectedQty = 0,
      acceptedQty = 0,
      reworkQty = 0,
      rejectedQty = 0,
      inspectorName
    } = req.body;

    if (!partName) return res.status(400).json({ message: "Part Name is required" });

    const finalInspectorName = inspectorName || req.user.name || req.user.username;

    const total = Number(acceptedQty) + Number(reworkQty) + Number(rejectedQty);

    const sql = `
      INSERT INTO addqc
      (partName, shift, location, inspectedQty, acceptedQty,
       reworkQty, rejectedQty, total, inspectorName, user_id, client_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await db.query(sql, [
      partName,
      shift || null,
      location || null,
      inspectedQty,
      acceptedQty,
      reworkQty,
      rejectedQty,
      total,
      finalInspectorName,
      userId,
      clientId, // must exist
    ]);

    res.status(200).json({ message: "QC Entry Saved Successfully" });

  } catch (error) {
    console.error("Save QC Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ================= GET PARTS FOR LOGGED-IN USER =================
exports.getPartsForUser = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    const userRole = req.user?.role;

    if (!userId || !userRole) return res.status(401).json({ message: "Unauthorized" });

    // Fetch client_id from user table
    const [userRows] = await db.query("SELECT client_id FROM user WHERE user_id = ?", [userId]);
    const clientId = userRows[0]?.client_id;

    if (!clientId) return res.status(401).json({ message: "Unauthorized: Missing client ID" });

    let sql = "SELECT * FROM parts";
    if (userRole.toLowerCase().includes("emp")) sql += " WHERE client_id = ?";

    const [rows] = await db.query(sql, userRole.toLowerCase().includes("emp") ? [clientId] : []);

    res.status(200).json({ data: rows });

  } catch (error) {
    console.error("Get Parts Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ================= GET ALL QC =================

exports.getAllQC = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Base SQL Query
    let sql = `
      SELECT 
        q.*, 
        u.username, 
        u.name AS user_name, 
        u.email_id,
        (SELECT COALESCE(SUM(r.qty), 0) 
         FROM reportqc r 
         WHERE r.addqc_id = q.id) AS reported_qty
      FROM addqc q
      LEFT JOIN user u ON q.user_id = u.user_id
    `;

    const params = [];

    // Change: Filter by the specific logged-in user_id instead of clientId
    // This ensures they only see their own records.
    if (userRole.toLowerCase().includes("emp")) {
      sql += ` WHERE q.user_id = ?`;
      params.push(userId);
    } 
    // Optional: If you want Admins to see everything in their company but NOT 
    // other companies, you can keep the clientId check for Admins here.

    sql += ` ORDER BY q.id DESC`;

    const [rows] = await db.query(sql, params);
    
    res.status(200).json({ success: true, data: rows });

  } catch (error) {
    console.error("Get QC Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};



// ================= GET QC DETAILS =================

exports.getMe = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const [rows] = await db.query(
      "SELECT user_id, name, username, role, client_id FROM user WHERE user_id = ?",
      [userId]
    );

    if (!rows.length) return res.status(404).json({ message: "User not found" });

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error("Fetch /me error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};


// ================= GET LOCATIONS BY LOGGED-IN USER =================
// ================= GET LOCATIONS BY CLIENT_ID =================
exports.getLocationsByClient = async (req, res) => {
    try {
        // 1. Get the user_id from the authenticated request (JWT token)
        const loggedInUserId = req.user?.user_id;

        if (!loggedInUserId) {
            return res.status(401).json({ 
                success: false, 
                message: "User not authenticated" 
            });
        }

        /**
         * THE LOGIC BASED ON YOUR DATA:
         * In 'user' table: client_id is the numeric link (e.g., 18 for Volkswagen).
         * In 'client' table: id is the numeric primary key (e.g., 18 for Volkswagen).
         * We join user.client_id with client.id to get the unique address.
         */
        const sql = `
            SELECT c.address 
            FROM client c
            INNER JOIN user u ON u.client_id = c.id
            WHERE u.user_id = ?
        `;

        // Execute the query
        const [rows] = await db.query(sql, [loggedInUserId]);

        // 3. Handle results
        if (rows.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No address found for this user's assigned client ID",
                data: []
            });
        }

        // Return the specific address linked to that numeric ID
        res.status(200).json({
            success: true,
            data: rows 
        });

    } catch (error) {
        console.error("Location Fetch Error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Database error occurred while fetching location" 
        });
    }
};






/* ============================================================
   ===================== QC DEFECT ============================
============================================================ */

// ================= Get Defects By QC ID =================
exports.getQCDefects = async (req, res) => {
  try {
    const { addqc_id } = req.params;

    const [rows] = await db.query(
      `SELECT * FROM reportqc 
       WHERE addqc_id = ?
       ORDER BY id DESC`,
      [addqc_id]
    );

    res.status(200).json(rows);

  } catch (error) {
    console.error("Get Defects Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};


// ================= Save QC Defect =================
exports.saveQCDefect = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { addqc_id, defect_name, qty } = req.body;

    if (!addqc_id || !defect_name || !qty) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    await connection.beginTransaction();

    // 1️⃣ Get allowed total
    const [qcRows] = await connection.query(
      `SELECT (reworkQty + rejectedQty) AS allowed
       FROM addqc WHERE id = ? FOR UPDATE`,
      [addqc_id]
    );

    if (!qcRows.length) {
      await connection.rollback();
      return res.status(404).json({ message: "QC not found" });
    }

    const allowed = Number(qcRows[0].allowed);

    // 2️⃣ Get current used
    const [sumRows] = await connection.query(
      `SELECT COALESCE(SUM(qty),0) AS used
       FROM reportqc
       WHERE addqc_id = ?`,
      [addqc_id]
    );

    const used = Number(sumRows[0].used);
    const remaining = allowed - used;

    if (qty > remaining) {
      await connection.rollback();
      return res.status(400).json({
        message: `Only ${remaining} quantity remaining`
      });
    }

    // 3️⃣ Insert
    await connection.query(
      `INSERT INTO reportqc (addqc_id, defect_name, qty)
       VALUES (?, ?, ?)`,
      [addqc_id, defect_name, qty]
    );

    await connection.commit();
    res.status(200).json({ message: "Defect Saved Successfully" });

  } catch (error) {
    await connection.rollback();
    console.error("Save Defect Error:", error);
    res.status(500).json({ message: "Server Error" });
  } finally {
    connection.release();
  }
};


// ================= Update QC Defect =================
exports.updateQCDefect = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { id, addqc_id, defect_name, qty } = req.body;

    await connection.beginTransaction();

    const [oldRow] = await connection.query(
      `SELECT qty FROM reportqc WHERE id = ? FOR UPDATE`,
      [id]
    );

    if (!oldRow.length) {
      await connection.rollback();
      return res.status(404).json({ message: "Defect not found" });
    }

    // 1️⃣ Allowed total
    const [qcRows] = await connection.query(
      `SELECT (reworkQty + rejectedQty) AS allowed
       FROM addqc WHERE id = ?`,
      [addqc_id]
    );

    const allowed = Number(qcRows[0].allowed);

    // 2️⃣ Used excluding current row
    const [sumRows] = await connection.query(
      `SELECT COALESCE(SUM(qty),0) AS used
       FROM reportqc
       WHERE addqc_id = ? AND id != ?`,
      [addqc_id, id]
    );

    const used = Number(sumRows[0].used);
    const remaining = allowed - used;

    if (qty > remaining) {
      await connection.rollback();
      return res.status(400).json({
        message: `Only ${remaining} quantity allowed`
      });
    }

    await connection.query(
      `UPDATE reportqc
       SET defect_name = ?, qty = ?
       WHERE id = ?`,
      [defect_name, qty, id]
    );

    await connection.commit();
    res.status(200).json({ message: "Updated Successfully" });

  } catch (error) {
    await connection.rollback();
    console.error("Update Defect Error:", error);
    res.status(500).json({ message: "Server Error" });
  } finally {
    connection.release();
  }
};


// ================= Delete QC Defect =================
exports.deleteQCDefect = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      `DELETE FROM reportqc WHERE id = ?`,
      [id]
    );

    res.status(200).json({ message: "Deleted Successfully" });

  } catch (error) {
    console.error("Delete Defect Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};