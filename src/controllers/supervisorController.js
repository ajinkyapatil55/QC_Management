const pool = require("../config/db");
const bcrypt = require("bcrypt");

// ================= GET ALL =================
exports.getAllSupervisors = async (req, res) => {
  try {
    const [rows] = await pool.query(`
  SELECT 
    u.user_id AS ID,
    u.name AS Name,
    u.gender AS Gender,
    u.dob AS DOB,
    u.contact_no1 AS Mobile,
    u.email_id AS Email,
    u.username AS Username,
    u.role AS Role,
    u.current_address AS CurrentAddress,
    u.permanent_address AS PermanentAddress,
    u.pincode AS Pincode,
    u.status AS Status,
    c.company AS Company
  FROM user u
  LEFT JOIN client c ON u.client_id = c.id
  ORDER BY u.user_id ASC
`);

    res.json(rows);
  } catch (err) {
    console.error("Get All Supervisors Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ================= GET BY ID =================
exports.getSupervisorById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM user WHERE user_id = ?",
      [id]
    );

    if (rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    res.json(rows[0]);
  } catch (err) {
    console.error("Get Supervisor Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ================= SAVE SUPERVISOR =================
exports.saveSupervisor = async (req, res) => {
  try {
    const {
      name,
      gender,
      dob,
      contact_no1,
      email_id,
      username,
      password,
      client_id,   // client ID selected from dropdown
      role,
      marital_status,
      current_address,
      permanent_address,
      pincode,
      status,
    } = req.body;

    // Validation
    if (!contact_no1)
      return res.status(400).json({ message: "Mobile number is required" });
    if (!client_id)
      return res.status(400).json({ message: "Client is required" });
    if (!username)
      return res.status(400).json({ message: "Username is required" });
    if (!password)
      return res.status(400).json({ message: "Password is required" });

    // HASH PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);

    // ------------- GET CLIENT NAME FROM client_id -------------
    const [clientResult] = await pool.query(
      "SELECT company FROM client WHERE id = ? LIMIT 1",
      [client_id]
    );
    const clientName = clientResult[0]?.company || null;

    if (!clientName)
      return res.status(400).json({ message: "Invalid client ID" });

    // ------------- INSERT INTO USER TABLE -------------
    const [result] = await pool.query(
      `INSERT INTO user
        (name, gender, dob, contact_no1, email_id, username, password, client_id, clientName, role, marital_status,
         current_address, permanent_address, pincode, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        gender || "",
        dob || null,
        contact_no1,
        email_id || "",
        username,
        hashedPassword,
        client_id,
        clientName,        // <-- store company name here
        role || "ROLE_SUP",
        marital_status || "",
        current_address || "",
        permanent_address || "",
        pincode || "",
        status || "Active",
      ]
    );

    res.json({ message: "Supervisor saved successfully", id: result.insertId });
  } catch (err) {
    console.error("Save Supervisor Error:", err);
    res.status(500).json({ message: "Database error", error: err.message });
  }
};

// ================= UPDATE =================
exports.updateSupervisor = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    gender,
    dob,
    contact_no1,
    email_id,
    username,
    password,
    client_id,
    role,
    marital_status,
    current_address,
    permanent_address,
    pincode,
    status,
  } = req.body;

  try {
    let sql = `
      UPDATE user SET
        name = ?, gender = ?, dob = ?, contact_no1 = ?, email_id = ?, username = ?,
        client_id = ?, role = ?, marital_status = ?, current_address = ?, permanent_address = ?, pincode = ?, status = ?
    `;

    const params = [
      name, gender, dob, contact_no1, email_id, username,
      client_id, role || "ROLE_SUP", marital_status || "",
      current_address || "", permanent_address || "", pincode || "", status || "Active"
    ];

    // HASH PASSWORD IF PROVIDED
    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);
      sql += ", password = ?";
      params.push(hashedPassword);
    }

    sql += " WHERE user_id = ?";
    params.push(id);

    const [result] = await pool.query(sql, params);

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "User not found" });

    res.json({ message: "Supervisor updated successfully" });
  } catch (err) {
    console.error("Update Supervisor Error:", err);
    res.status(500).json({ message: "Database error", error: err.message });
  }
};

// ================= DELETE =================
exports.deleteSupervisor = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      "DELETE FROM user WHERE user_id = ?",
      [id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "User not found" });

    res.json({ message: "Supervisor deleted successfully" });
  } catch (err) {
    console.error("Delete Supervisor Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

