const db = require("../config/db");

// ================= ALL DAILY REPORTS (DATE + PART WISE) =================
exports.getAllDailyReports = async (req, res) => {
  try {
    const role = req.user.role;

    // ---------------- Only admins get all data ----------------
    if (role !== "ROLE_ADMIN") {
      // Non-admin users: return empty array by default
      return res.status(200).json({ success: true, data: [] });
    }

    // Admin: return all reports
    const query = `
      SELECT
        DATE(created_at) AS date,
        partName,
        SUM(inspectedQty) AS inspected,
        SUM(reworkQty) AS rework,
        SUM(rejectedQty) AS rejected
      FROM addqc
      GROUP BY DATE(created_at), partName
      ORDER BY DATE(created_at), partName
    `;

    const [rows] = await db.query(query);
    res.status(200).json({ success: true, data: rows });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


// ================= GET LOGGED-IN USER CLIENT =================
// exports.getUserClient = async (req, res) => {
//   try {
//     // console.log("Logged-in user object:", req.user);

//     const userId = req.user.user_id; // <-- FIXED
//     // console.log("Logged-in user ID:", userId);

//     const [result] = await db.query(
//       `SELECT c.company AS clientName, c.id AS clientId
//        FROM user u
//        JOIN client c ON u.client_id = c.id
//        WHERE u.user_id = ?
//        LIMIT 1`,
//       [userId]
//     );

//     // console.log("Client query result:", result);

//     const client = result[0] || null;

//     res.status(200).json({
//       success: true,
//       data: client,
//     });
//   } catch (err) {
//     console.error("Get User Client Error:", err);
//     res.status(500).json({
//       success: false,
//       message: "Database Error",
//       error: err.message,
//     });
//   }
// };


// ================= GET LOGGED-IN USER CLIENT WITH ADDRESS =================
exports.getUserClient = async (req, res) => {
  try {
    if (!req.user || !req.user.user_id) {
      console.log("AUTH ERROR: No user_id in req.user");
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No user session found"
      });
    }

    const userId = req.user.user_id;

    // We use 'client_id' as the alias to match the frontend expectations
    const [result] = await db.query(
      `SELECT 
        c.company AS clientName, 
        c.id AS client_id, 
        c.address AS clientAddress
       FROM user u
       JOIN client c ON u.client_id = c.id
       WHERE u.user_id = ?
       LIMIT 1`,
      [userId]
    );

    // console.log(`DEBUG: Found client for User ${userId}:`, result[0]);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No client data found for this user"
      });
    }

    res.status(200).json({
      success: true,
      data: result[0], 
    });

  } catch (err) {
    console.error("Get User Client Error:", err);
    res.status(500).json({
      success: false,
      message: "Database Error",
      error: err.message,
    });
  }
};

// Controller method to get daily report filtered by date and client
exports.getDailyReportByDate = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    const { date } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 1. Get the user's specific client_id (Safety Check)
    const [userRows] = await db.query(
      "SELECT client_id FROM user WHERE user_id = ?",
      [userId]
    );
    const userClientId = userRows[0]?.client_id;

    if (!userClientId) {
      return res.status(403).json({ message: "No client assigned to this user" });
    }

    // 2. Fetch data ONLY for that client_id
    // We include location here to separate reports by address as seen in your image
    const sql = `
      SELECT 
        partName,
        location,
        DATE(created_at) AS date,
        SUM(inspectedQty) AS inspected,
        SUM(reworkQty) AS rework,
        SUM(rejectedQty) AS rejected
      FROM addqc
      WHERE DATE(created_at) = ? AND client_id = ?
      GROUP BY partName, location, DATE(created_at)
      ORDER BY partName ASC
    `;

    const [rows] = await db.query(sql, [date, userClientId]);

    res.status(200).json({ 
      success: true, 
      data: rows 
    });

  } catch (error) {
    console.error("Get Daily Report Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};