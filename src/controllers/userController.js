const pool = require("../config/db");

// ================== USER CONTROLLER =================
exports.getUserDetails = async (req, res) => {
  try {
    const userId = req.user.user_id;

    // We change the JOIN to match u.client_id with c.id (the numeric primary key)
    const sql = `
      SELECT 
        u.username, 
        u.name, 
        u.contact_no1, 
        u.clientName,
        u.client_id,
        c.address AS clientAddress,
        c.company AS officialCompanyName
      FROM \`user\` AS u
      LEFT JOIN \`client\` AS c ON u.client_id = c.id
      WHERE u.user_id = ?
    `;

    const [rows] = await pool.query(sql, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userData = rows[0];

    // console.log("-----------------------------------------");
    // console.log("User Name:", userData.name);
    // console.log("Matching Client ID (from user table):", userData.client_id);
    // console.log("Fetched Address:", userData.clientAddress);
    // console.log("-----------------------------------------");

    return res.status(200).json({
      user: {
        username: userData.username || "",
        name: userData.name || "",
        contact_no1: userData.contact_no1 || "",
        clientName: userData.officialCompanyName || userData.clientName || "",
        address: userData.clientAddress || "Address Not Found In Client Table"
      }
    });

  } catch (error) {
    console.error("DATABASE ERROR:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================== Get Username for Dashboard ==================
exports.getUsername = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    // req.user comes from JWT
    return res.status(200).json({
      username: req.user.username || "Guest",
    });
  } catch (error) {
    console.error("Error fetching username:", error);
    return res.status(500).json({ message: "Server error" });
  }
};