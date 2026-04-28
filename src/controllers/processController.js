// processController.js
const db = require("../config/db");

/**
 * -----------------------------
 * Get All Processes for Logged-in User
 * -----------------------------
 * Fetches only the processes belonging to the logged-in user's company.
 */
exports.getAllProcesses = async (req, res) => {
  try {
    //console.log("REQ.USER:", req.user);

    // 1️⃣ Validate user from JWT
    if (!req.user || !req.user.client_id || !req.user.company) {
      return res.status(401).json({ message: "Unauthorized: no company found" });
    }

    const userCompany = req.user.company;

    // 2️⃣ Fetch processes filtered by company
    const sql = `
      SELECT *
      FROM process_master
      WHERE client_id = ?
      ORDER BY id ASC
    `;
    const [rows] = await db.query(sql, [req.user.client_id]);

    // 3️⃣ Return process list
    res.status(200).json(rows);
  } catch (err) {
    console.error("Get All Processes Error:", err.message);
    res.status(500).json({ message: "Database Error", error: err.message });
  }
};

/**
 * -----------------------------
 * Get Process Details
 * -----------------------------
 * Fetches a single process by its ID
 */
exports.getProcessDetails = async (req, res) => {
  try {
    const id = req.params.id;

    const sql = "SELECT * FROM process_master WHERE id = ?";
    const [rows] = await db.query(sql, [id]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Process not found" });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error("Get Process Details Error:", err.message);
    res.status(500).json({ message: "Database Error", error: err.message });
  }
};


/**
 * -----------------------------
 * Save Process
 * -----------------------------
 * Creates a new process record and links it to the logged-in user's client_id
 */
// processController.js

exports.saveProcess = async (req, res) => {
  try {
    // 1️⃣ Extract data from request body
    const { company, partName, processName, note } = req.body;

    // 2️⃣ Extract client_id from the authenticated user (populated by middleware)
    // Note: Use lowercase 'req.user'
    const clientId = req.user?.client_id;

    // 3️⃣ Basic validation
    if (!clientId) {
      return res.status(401).json({ message: "Unauthorized: No client association found" });
    }
    
    // Fixed: Corrected variable names and removed extra '!'
    if (!company || !partName || !processName) {
      return res.status(400).json({ message: "Company, Part Name and Process Name are required" });
    }

    // 4️⃣ Include client_id in the SQL Query
    // Use lowercase 'sql' consistently
    const sql = `
      INSERT INTO process_master (company, client_id, partName, processName, note)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    await db.query(sql, [company, clientId, partName, processName, note]);

    res.status(201).json({ message: "Process Saved Successfully" });

  } catch (err) {
    // Fixed: lowercase 'catch' and 'err.message'
    console.error("Save Process Error:", err.sqlMessage || err.message);
    res.status(500).json({ message: err.sqlMessage || "Database Error" });
  }
};

/**
 * -----------------------------
 * Update Process
 * -----------------------------
 * Updates an existing process by ID
 */
exports.updateProcess = async (req, res) => {
  try { // Fixed: lowercase 'try'
    const { id, company, partName, processName, note } = req.body;

    // 1️⃣ Extract client_id from the token (req.user)
    const clientId = req.user?.client_id;

    if (!id) {
      return res.status(400).json({ message: "Process ID is required for update" });
    }
    
    if (!clientId) {
      return res.status(401).json({ message: "Unauthorized: No client association found" });
    }

    // 2️⃣ Secure SQL: Update WHERE id AND client_id match
    // This prevents User A from updating User B's records if they guess the ID
    const sql = `
      UPDATE process_master
      SET company = ?, partName = ?, processName = ?, note = ?
      WHERE id = ? AND client_id = ?
    `;
    
    // Fixed: variable name 'sql' must be lowercase to match the definition
    const [result] = await db.query(sql, [company, partName, processName, note, id, clientId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Process not found or unauthorized to update" });
    }

    res.status(200).json({ message: "Process Updated Successfully" });

  } catch (err) { // Fixed: lowercase 'catch'
    console.error("Update Process Error:", err.sqlMessage || err.message);
    res.status(500).json({ message: err.sqlMessage || "Database Error" });
  }
};

/**
 * -----------------------------
 * Delete Process
 * -----------------------------
 * Deletes a process by its ID
 */
exports.deleteProcess = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({ message: "Process ID is required for deletion" });
    }

    const sql = "DELETE FROM process_master WHERE id = ?";
    const [result] = await db.query(sql, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Process not found or already deleted" });
    }

    res.status(200).json({ message: "Process Deleted Successfully" });
  } catch (err) {
    console.error("Delete Process Error:", err.sqlMessage || err.message);
    res.status(500).json({ message: err.sqlMessage || "Database Error" });
  }
};