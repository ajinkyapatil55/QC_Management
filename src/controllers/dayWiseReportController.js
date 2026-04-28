const db = require("../config/db");

// ================= DAY WISE REPORT =================
exports.getDayWiseReport = async (req, res) => {
  try {
    const clientId = req.user?.client_id; // 🔹 use the correct property
    const { fromDate, toDate } = req.query;

    if (!clientId) {
      return res.status(401).json({ message: "Unauthorized: Missing clientId" });
    }

    let sql = `
      SELECT 
        DATE(created_at) AS date,
        partName,
        SUM(inspectedQty) AS inspected,
        SUM(reworkQty) AS rework,
        SUM(rejectedQty) AS rejected
      FROM addqc
      WHERE client_id = ?
    `;

    const params = [clientId];

    if (fromDate) {
      sql += " AND DATE(created_at) >= ?";
      params.push(fromDate);
    }

    if (toDate) {
      sql += " AND DATE(created_at) <= ?";
      params.push(toDate);
    }

    sql += `
      GROUP BY DATE(created_at), partName
      ORDER BY DATE(created_at) DESC, partName ASC
    `;

    // console.log("Final SQL:", sql);
    // console.log("Params:", params);

    const [rows] = await db.query(sql, params);

    // console.log("Fetched Rows:", rows);

    res.status(200).json(rows);
  } catch (error) {
    console.error("Day Wise Report Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};