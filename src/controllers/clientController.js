const db = require("../config/db");

// ================= Get All Clients =================
exports.getAllClients = async (req, res) => {
  try {
    const userRole = req.user.role;

    // Since ROLE_SUP is the Owner, they should see ALL clients
    if (userRole === "ROLE_SUP") {
      const [result] = await db.query(
        "SELECT * FROM client ORDER BY id ASC" // No WHERE clause here
      );
      return res.json(result);
    }

    // If you have other roles like ROLE_HR who should only see limited data:
    if (userRole === "ROLE_HR") {
      const userCompanyId = req.user.client_id;
      const [result] = await db.query(
        "SELECT * FROM client WHERE client_id = ? ORDER BY id ASC",
        [userCompanyId]
      );
      return res.json(result);
    }

    // If no roles match, return empty or error
    res.json([]);

  } catch (err) {
    console.error("Get Clients Error:", err);
    res.status(500).json({ message: "Database Error", error: err.message });
  }
};

// ================= Save Client =================
exports.saveClient = async (req, res) => {
  try {
    const { company, mobile, email, gst, address, pincode, status } = req.body;

    // Insert without client_id
    const [result] = await db.query(
      "INSERT INTO client (company, mobile, email, gst, address, pincode, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [company, mobile, email, gst, address, pincode, status]
    );

    // Generate client_id based on auto-incremented id
    const clientId = `CLT${String(result.insertId).padStart(4, "0")}`;

    // Update the inserted row
    await db.query("UPDATE client SET client_id=? WHERE id=?", [clientId, result.insertId]);

    res.send({ message: "Client Saved Successfully", client_id: clientId });
  } catch (err) {
    console.error("Save Client Error:", err);
    res.status(500).send({ message: err.sqlMessage || err.message || "Insert Failed" });
  }
};


// ================= Update Client =================
exports.updateClient = async (req, res) => {
  try {
    const { id, company, mobile, email, gst, address, pincode, status } = req.body;

    const sql = `
      UPDATE client
      SET company=?, mobile=?, email=?, gst=?, address=?, pincode=?, status=?
      WHERE id=?
    `;

    await db.query(sql, [
      company,
      mobile,
      email,
      gst,
      address,
      pincode,
      status,
      id,
    ]);

    res.send({ message: "Client Updated Successfully" });
  } catch (err) {
    console.error("Update Client Error:", err);
    res.status(500).send("Update Failed");
  }
};


// ================= Get Single Client =================
exports.getClientDetails = async (req, res) => {
  try {
    const id = req.params.id; // client id from URL
    const sql = "SELECT * FROM client WHERE id = ?";
    const [rows] = await db.query(sql, [id]);

    if (rows.length === 0) {
      return res.status(404).send({ message: "Client not found" });
    }

    res.json(rows[0]); // send the first (and only) row
  } catch (err) {
    console.error("Get Client Details Error:", err);
    res.status(500).send("Database Error");
  }
};


// ================= Delete Client =================
exports.deleteClient = async (req, res) => {
  try {
    const id = req.params.id;

    const sql = "DELETE FROM client WHERE id=?";
    await db.query(sql, [id]);

    res.send({ message: "Client Deleted Successfully" });
  } catch (err) {
    console.error("Delete Client Error:", err);
    res.status(500).send("Delete Failed");
  }
};


// ================= Fetch only active clients' company names =================
exports.getAllClientCompanies = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT DISTINCT company FROM client WHERE status='Active' ORDER BY company ASC"
    );

    // Return only company names as array
    const companies = rows.map(row => row.company);
    res.json(companies);
  } catch (err) {
    console.error("Get Companies Error:", err);
    res.status(500).send({ message: "Database error" });
  }
};

// get all info
exports.getMyInfo = async (req, res) => {
  const clientId = req.user.id; // comes from JWT payload

  try {
    const [rows] = await db.execute(
      "SELECT id, company, mobile, email, gst, address, pincode, status, created_at, updated_at FROM client WHERE id = ?",
      [clientId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};