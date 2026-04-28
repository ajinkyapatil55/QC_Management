const db = require("../config/db");

// ================= INSPECTOR + PART WISE REPORT =================
exports.getInspectorWiseReport = async (req, res) => {
  try {
    // 🔹 Get client_id from JWT (set by your auth middleware)
    const clientId = req.user?.client_id;

    if (!clientId) {
      return res.status(401).json({ message: "Unauthorized: Missing client_id" });
    }

    const sql = `
      SELECT
        inspectorName,
        partName,
        SUM(inspectedQty) AS inspected,
        SUM(reworkQty) AS rework,
        SUM(rejectedQty) AS rejected,
        MAX(created_at) AS created_at
      FROM addqc
      WHERE client_id = ?
      GROUP BY inspectorName, partName
      ORDER BY inspectorName ASC, partName ASC
    `;

    const [rows] = await db.query(sql, [clientId]);

    // console.log("Inspector Wise Rows for client_id", clientId, ":", rows);

    res.status(200).json(rows);
  } catch (error) {
    console.error("Inspector Wise Report Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ================= GET COMPANY EMPLOYEES FOR INSPECTOR DROPDOWN =================

exports.getCompanyWiseEmployees = async (req, res) => {
  try {
    // 1. Get client_id of the logged-in user from the JWT
    const loggedInUserClientId = req.user?.client_id;

    if (!loggedInUserClientId) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized: No client context found" 
      });
    }

    // 2. Fetch users who share the same client_id AND have the role 'ROLE_EMP'
    // This ensures that Admins or other roles don't appear in the inspector dropdown.
    const sql = `
      SELECT 
        user_id, 
        name AS employeeName, 
        role, 
        username 
      FROM user 
      WHERE client_id = ? 
        AND role = 'ROLE_EMP' 
        AND status = 'Active'
      ORDER BY name ASC
    `;

    const [employees] = await db.query(sql, [loggedInUserClientId]);

    res.status(200).json({
      success: true,
      data: employees
    });
  } catch (error) {
    console.error("Error fetching company employees:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error" 
    });
  }
};