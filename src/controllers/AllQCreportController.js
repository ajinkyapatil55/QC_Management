const db = require("../config/db");

// ===============================
// Get Employees by Company
// ===============================
exports.getCompanyEmployees = async (req, res) => {
  try {
    const clientId = req.user?.client_id;

    // console.log("Logged user:", req.user); // ✅ DEBUG
    // console.log("clientId:", clientId);

    if (!clientId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No client_id",
      });
    }

    const [rows] = await db.query(
      `SELECT user_id, name 
       FROM user 
       WHERE client_id = ? 
       AND role = 'ROLE_EMP'
       ORDER BY name ASC`,
      [clientId]
    );

    // console.log("Employees:", rows); // ✅ DEBUG

    res.status(200).json({
      success: true,
      data: rows, // ✅ STANDARD KEY
    });

  } catch (error) {
    console.error("getCompanyEmployees Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


// ===============================
// Get QC Reports for Client
// Optional filters: start_date, end_date, partName, user_id
// ===============================
exports.getCompanyQcReports = async (req, res) => {
  try {
    const clientId = req.user.client_id;

    // Optional query params
    const userId = req.query.user_id ? Number(req.query.user_id) : null;
    const partName = req.query.partName || null;
    const startDate = req.query.start_date || null;
    const endDate = req.query.end_date || null;

    // -------------------------------
    // Base SQL query
    // -------------------------------
    let query = `
      SELECT 
        a.id,
        a.partName,
        a.shift,
        a.location,
        a.inspectedQty,
        a.acceptedQty,
        a.reworkQty,
        a.rejectedQty,
        a.inspectorName,
        a.user_id,
        a.created_at,
        r.defect_name,
        r.qty
      FROM addqc a
      LEFT JOIN reportqc r 
        ON a.id = r.addqc_id
      WHERE a.client_id = ?
    `;

    const params = [clientId];

    // -------------------------------
    // Optional filters
    // -------------------------------
    if (startDate && endDate) {
      query += " AND DATE(a.created_at) BETWEEN ? AND ?";
      params.push(new Date(startDate).toISOString().split("T")[0]);
      params.push(new Date(endDate).toISOString().split("T")[0]);
    }

    if (userId !== null) {
      query += " AND a.user_id = ?";
      params.push(userId);
    }

    if (partName) {
      query += " AND a.partName = ?";
      params.push(partName);
    }

    query += " ORDER BY a.id DESC";

    // -------------------------------
    // Execute query
    // -------------------------------
    const [rows] = await db.query(query, params);

    // -------------------------------
    // Group defects per QC entry
    // -------------------------------
    const reportMap = {};
    rows.forEach((row) => {
      if (!reportMap[row.id]) {
        reportMap[row.id] = {
          id: row.id,
          partName: row.partName,
          shift: row.shift,
          location: row.location,
          inspectedQty: row.inspectedQty,
          acceptedQty: row.acceptedQty,
          reworkQty: row.reworkQty,
          rejectedQty: row.rejectedQty,
          inspectorName: row.inspectorName,
          user_id: row.user_id,
          created_at: row.created_at,
          defects: [],
        };
      }
      if (row.defect_name) {
        reportMap[row.id].defects.push({
          defect_name: row.defect_name,
          qty: row.qty,
        });
      }
    });

    const finalData = Object.values(reportMap);

    res.status(200).json({
      success: true,
      reports: finalData,
    });
  } catch (error) {
    console.error("QC REPORT ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};