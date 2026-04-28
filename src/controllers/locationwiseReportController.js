const db = require("../config/db");

// ================= LOCATION WISE REPORT (MATCH BY ADDRESS) =================
exports.getLocationWiseReport = async (req, res) => {
  try {
    const loggedInUserId = req.user?.user_id;
    const { location } = req.query; // This will be the address string from frontend

    if (!loggedInUserId) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized: User session not found" 
      });
    }

    // Base parameters always include the logged-in user
    let queryParams = [loggedInUserId];
    let locationFilter = "";

    // If the user selects a specific address/location in the frontend dropdown
    if (location && location !== "" && location !== "All Locations") {
      locationFilter = "AND c.address = ?";
      queryParams.push(location);
    }

   const sql = `
  SELECT
    c.address AS location,
    q.partName,
    q.inspectorName,
    DATE_FORMAT(q.created_at, '%Y-%m-%d') AS reportDate,
    SUM(q.inspectedQty) AS inspected,
    SUM(q.reworkQty) AS rework,
    SUM(q.rejectedQty) AS rejected
  FROM addqc q
  INNER JOIN client c ON q.client_id = c.id
  INNER JOIN user u ON u.clientName = c.company
  WHERE u.user_id = ? ${locationFilter}
  GROUP BY c.address, q.partName, q.inspectorName, reportDate -- Added q.inspectorName here
  ORDER BY reportDate DESC, c.address ASC, q.partName ASC
`;

    const [rows] = await db.query(sql, queryParams);
    res.status(200).json(rows);

  } catch (error) {
    console.error("Location Wise Report Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server Error occurred while generating report" 
    });
  }
};