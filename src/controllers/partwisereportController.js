const db = require("../config/db");

// ================= PART WISE REPORT =================
exports.getPartWiseReport = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { partName } = req.query;

    if (!partName) {
      // If no search input, return empty array
      return res.status(200).json([]);
    }

    // Fetch user's client_id
    const [userRows] = await db.query(
      "SELECT client_id FROM user WHERE user_id = ?",
      [userId]
    );

    if (!userRows.length) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    const clientId = userRows[0].client_id;
    // console.log("Logged-in user's client_id:", clientId);

    // Query only for this client and partName
    const sql = `
      SELECT
        partName,
        SUM(inspectedQty) AS inspected,
        SUM(reworkQty) AS rework,
        SUM(rejectedQty) AS rejected
      FROM addqc
      WHERE client_id = ? AND partName LIKE ?
      GROUP BY partName
      ORDER BY partName ASC
    `;

    const params = [clientId, `%${partName}%`];
    const [rows] = await db.query(sql, params);

    res.status(200).json(rows);
  } catch (error) {
    console.error("Part Wise Report Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ================= Fetch Companies with Parts for Logged-in User =================
exports.getCompaniesWithParts = async (req, res) => {
  try {
    const userId = req.user?.user_id; // Logged-in user ID
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // ---------------- Fetch user's client_id ----------------
    const [userRows] = await db.query(
      "SELECT client_id, clientName FROM user WHERE user_id = ?",
      [userId]
    );

    if (!userRows.length) {
      console.log("No user found with user_id:", userId);
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    const clientId = userRows[0]?.client_id;
    const clientName = userRows[0]?.clientName;

    // console.log("Logged-in userId:", userId);
    // console.log("User client_id:", clientId);
    // console.log("User clientName:", clientName);

    if (!clientId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Missing client_id" });
    }

    // ---------------- Fetch parts for this client_id ----------------
    const [rows] = await db.query(
      `SELECT DISTINCT partName 
       FROM addqc 
       WHERE client_id = ? 
       ORDER BY partName ASC`,
      [clientId]
    );

    // console.log("Parts fetched for client_id", clientId, ":", rows);

    // Map to array of part names for dropdown
    const parts = rows.map((r) => r.partName);

    res.status(200).json(parts);
  } catch (error) {
    console.error("Fetch Companies/Parts Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};