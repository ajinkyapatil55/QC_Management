const db = require("../config/db");
const moment = require("moment");

// ================= TOTAL USERS =================
exports.getTotalUsers = async (req, res) => {
  try {
    const clientId = req.user.client_id;

    const [rows] = await db.query(
      "SELECT COUNT(*) AS totalUsers FROM user WHERE client_id = ?",
      [clientId]
    );

    res.json({
      totalUsers: rows[0]?.totalUsers || 0,
    });
  } catch (err) {
    console.error("Total Users Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ================= TOTAL PARTS =================
exports.getTotalParts = async (req, res) => {
  try {
    const clientId = req.user.client_id;

    const [rows] = await db.query(
      "SELECT COUNT(*) AS totalParts FROM parts WHERE client_id = ?",
      [clientId]
    );

    res.json({
      totalParts: rows[0]?.totalParts || 0,
    });
  } catch (err) {
    console.error("Total Parts Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ================= TOTAL QC =================
exports.getTotalQC = async (req, res) => {
  try {
    const clientId = req.user.client_id;

    const [rows] = await db.query(
      "SELECT COUNT(*) AS totalQCEntries FROM addqc WHERE client_id = ?",
      [clientId]
    );

    res.json({
      totalQCEntries: rows[0]?.totalQCEntries || 0,
    });
  } catch (err) {
    console.error("Total QC Error:", err);
    res.status(500).json({ error: err.message });
  }
};


// ================= TOTAL QC =================
exports.getTotalQCreport = async (req, res) => {
  try {
    const clientId = req.user.client_id;

    const [rows] = await db.query(
      "SELECT COUNT(*) AS totalQCEntries FROM addqc WHERE client_id = ?",
      [clientId]
    );

    res.json({
      totalQCEntries: rows[0]?.totalQCEntries || 0,
    });
  } catch (err) {
    console.error("Total QC Error:", err);
    res.status(500).json({ error: err.message });
  }
};


// ================= Total Defects Report =================
exports.getTotalDefectsReport = async (req, res) => {
  try {
    const clientId = req.user.client_id;
    const [rows] = await db.query(
      "SELECT COUNT(*) AS totalDefects FROM reportqc WHERE client_id = ?",
      [clientId]
    );

    res.json({
      totalDefects: rows[0]?.totalDefects || 0,
    });
  } catch (err) {
    console.error("Total Defects Report Error:", err);
    res.status(500).json({ error: err.message });
  }
};


// ================= TODAY / WEEKLY / MONTHLY QC =================
exports.getQCStats = async (req, res) => {
  try {
    const clientId = req.user.client_id;

    // Today
    const todayStart = moment().startOf("day").format("YYYY-MM-DD HH:mm:ss");
    const todayEnd = moment().endOf("day").format("YYYY-MM-DD HH:mm:ss");

    // Week
    const weekStart = moment().startOf("week").format("YYYY-MM-DD HH:mm:ss");
    const weekEnd = moment().endOf("week").format("YYYY-MM-DD HH:mm:ss");

    // Month
    const monthStart = moment().startOf("month").format("YYYY-MM-DD HH:mm:ss");
    const monthEnd = moment().endOf("month").format("YYYY-MM-DD HH:mm:ss");

    // Helper query function
    const getCounts = async (start, end) => {
      const [rows] = await db.query(
        `SELECT
       SUM(inspectedQty) AS inspected,
       SUM(reworkQty) AS rework,
       SUM(rejectedQty) AS reject
     FROM addqc
     WHERE client_id = ? AND created_at BETWEEN ? AND ?`,
        [clientId, start, end]
      );

      return {
        inspected: rows[0]?.inspected || 0,
        rework: rows[0]?.rework || 0,
        reject: rows[0]?.reject || 0,
      };
    };

    const todayCounts = await getCounts(todayStart, todayEnd);
    const weeklyCounts = await getCounts(weekStart, weekEnd);
    const monthlyCounts = await getCounts(monthStart, monthEnd);

    res.json({
      today: todayCounts,
      weekly: weeklyCounts,
      monthly: monthlyCounts,
    });
  } catch (err) {
    console.error("QC Stats Error:", err);
    res.status(500).json({ error: err.message });
  }
};



// Fetch  data on data table 

// ================= FETCH ALL USERS =================
exports.getAllUsers = async (req, res) => {
  try {
    const clientId = req.user.client_id;

    // Fetch all user details
    const [userRows] = await db.query(
      `SELECT 
         user_id AS id,
         name,
         gender,
         DATE_FORMAT(dob, '%d/%m/%Y') AS dob,
         contact_no1,
         email_id,
         role,
         current_address,
         status
       FROM user
       WHERE client_id = ?
       ORDER BY user_id DESC`,
      [clientId]
    );

    res.json({
      users: userRows || [],
    });
  } catch (err) {
    console.error("Fetch All Users Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// // ================= Get All Parts (company-restricted) =================
// exports.getAllPartsDashbord = async (req, res) => {
//   try {
//     if (!req.user || !req.user.company) {
//       return res.status(401).json({ message: "Unauthorized: no company found" });
//     }

//     const userCompany = req.user.company;
//     // console.log("Fetching parts for company:", userCompany);

//     // Format updated_at to dd/mm/yyyy directly in SQL
//     const sql = `
//       SELECT 
//         id,
//         company,
//         partName,
//         partNumber,
//         category,
//         description,
//         DATE_FORMAT(updated_at, '%d/%m/%Y') AS updated_at
//       FROM parts 
//       WHERE company = ? 
//       ORDER BY id DESC
//     `;
//     const [rows] = await db.query(sql, [userCompany]);

//     // console.log(`Found ${rows.length} parts for ${userCompany}`);
//     res.json(rows);
//   } catch (err) {
//     console.error("Get Parts Error:", err);
//     res.status(500).json({ message: "Database Error", error: err.message });
//   }
// };


// ================= Get All Parts (Strictly Restricted by client_id) =================
exports.getAllPartsDashbord = async (req, res) => {
  try {
    // Use client_id from the token for better security than the company name string
    const loggedInClientId = req.user?.client_id;

    if (!loggedInClientId) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized: No valid client_id found in session" 
      });
    }

    // SQL query using client_id to ensure Volkswagen (18) never sees Tata (1)
    const sql = `
      SELECT 
        id,
        company,
        partName,
        partNumber,
        category,
        description,
        DATE_FORMAT(updated_at, '%d/%m/%Y') AS updated_at
      FROM parts 
      WHERE client_id = ? 
      ORDER BY id DESC
    `;

    const [rows] = await db.query(sql, [loggedInClientId]);

    // Return the restricted data
    res.status(200).json(rows);

  } catch (err) {
    console.error("Get Parts Error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Database Error", 
      error: err.message 
    });
  }
};




// ================= Get All QC Summary Entries =================
exports.getAllQCEntries = async (req, res) => {
  try {
    const clientId = req.user.client_id; // restrict by client

    const sql = `
      SELECT 
        id,
        partName AS part_name,
        inspectedQty AS inspected,
        reworkQty AS rework,
        rejectedQty AS reject,
        inspectorName AS inspected_name
      FROM addqc
      WHERE client_id = ?
      ORDER BY id DESC
    `;

    const [rows] = await db.query(sql, [clientId]);

    // console.log(`Fetched ${rows.length} QC entries for client ${clientId}`);

    res.json({ entries: rows }); // frontend expects res.data.entries
  } catch (err) {
    console.error("Get QC Entries Error:", err);
    res.status(500).json({ message: "Database Error", error: err.message });
  }
};


// ================= Get All Report QC Entries =================
exports.getAllReportQCEntries = async (req, res) => {
  try {
    const clientId = req.user.client_id; // restrict by client

    // Fetch only from reportqc
    const sql = `
      SELECT 
        id,
        partName,
        defect_name,
        qty,
        DATE_FORMAT(updated_at, '%d/%m/%Y') AS updated_at
      FROM reportqc
      where addqc_id = ?
      ORDER BY id DESC
    `;

    const [rows] = await db.query(sql, [clientId]);

    // console.log(`Fetched ${rows.length} Report QC entries for client ${clientId}`);

    res.json({ entries: rows }); // frontend expects res.data.entries
  } catch (err) {
    console.error("Get Report QC Entries Error:", err);
    res.status(500).json({ message: "Database Error", error: err.message });
  }
};






// ================== HR Dashboard ======================== 

// ================= 1. SHIFT WISE REPORT =================
exports.getShiftWiseReport = async (req, res) => {
  try {
    const clientId = req.user.client_id;
    const [rows] = await db.query(
      `SELECT 
        shift, 
        SUM(inspectedQty) AS inspected, 
        SUM(reworkQty) AS rework, 
        SUM(rejectedQty) AS reject
      FROM addqc 
      WHERE client_id = ? 
      GROUP BY shift`,
      [clientId]
    );
    res.json(rows);
  } catch (err) {
    console.error("Shift Report Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ================= 2. DEFECT WISE REPORT =================
exports.getDefectWiseReport = async (req, res) => {
  try {
    const clientId = req.user.client_id;

    const [rows] = await db.query(
      `SELECT 
    r.defect_name AS name,
    r.partName,
    SUM(r.qty) AS value
  FROM reportqc r
  JOIN addqc a ON r.addqc_id = a.id
  WHERE a.client_id = ?
  GROUP BY r.defect_name, r.partName`,
      [clientId]
    );

    res.json(rows);
  } catch (err) {
    console.error("Defect Report Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ================= 3. PART WISE REPORT =================
exports.getPartWiseReport = async (req, res) => {
  try {
    const clientId = req.user.client_id;
    const [rows] = await db.query(
      `SELECT 
        partName AS part, 
        SUM(inspectedQty) AS inspected, 
        SUM(reworkQty) AS rework, 
        SUM(rejectedQty) AS reject
      FROM addqc 
      WHERE client_id = ? 
      GROUP BY partName`,
      [clientId]
    );
    res.json(rows);
  } catch (err) {
    console.error("Part Report Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ================= 4. INSPECTOR WISE REPORT =================
exports.getInspectorWiseReport = async (req, res) => {
  try {
    const clientId = req.user.client_id;
    const [rows] = await db.query(
      `SELECT 
        inspectorName AS name, 
        SUM(inspectedQty) AS inspected, 
        SUM(reworkQty) AS rework, 
        SUM(rejectedQty) AS reject
      FROM addqc 
      WHERE client_id = ? 
      GROUP BY inspectorName`,
      [clientId]
    );
    res.json(rows);
  } catch (err) {
    console.error("Inspector Report Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};




/// ===================================
// OWNER DASHBOARD CONTROLLER
// ===================================



// // ================= 1. Get User Details =================
exports.getUserDetails = async (req, res) => {
  try {
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const [rows] = await db.query(
      `SELECT user_id, username, role, client_id 
       FROM user 
       WHERE user_id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: rows[0] });

  } catch (err) {
    console.error("Fetch User Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};


// ================= TOTAL USERS =================
exports.getAllTotalUsers = async (req, res) => {
  try {
    // 1. Fetch the actual list of users
    // Note: If your client table is named something else, change 'client' below
    const [workers] = await db.query(`
  SELECT 
    u.user_id,
    u.name AS name,        -- ✅ FIXED (use actual name)
    u.role,
    u.status
  FROM user u
`);

    res.json({
      totalWorkers: workers.length,
      workers: workers 
    });
  } catch (err) {
    console.error("Total Users Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ================= ACTIVE USERS =================
exports.getActiveUsers = async (req, res) => {
  try {
    const [workers] = await db.query(`
      SELECT 
        u.user_id, 
        u.username AS name, 
        u.role, 
        u.status
      FROM user u 
      WHERE u.status = 'Active'
    `);

    res.json({
      activeCount: workers.length,
      workers: workers
    });
  } catch (err) {
    console.error("Active Users Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ================= INACTIVE USERS =================
exports.getInactiveUsers = async (req, res) => {
  try {
    const [workers] = await db.query(`
      SELECT 
        u.user_id, 
        u.username AS name, 
        u.role, 
        u.status
      FROM user u 
      WHERE u.status != 'Active'
    `);

    res.json({
      inactiveCount: workers.length,
      workers: workers
    });
  } catch (err) {
    console.error("Inactive Users Error:", err);
    res.status(500).json({ error: err.message });
  }
};


// // ================= 3. Get All Clients =================
// exports.getAllClients = async (req, res) => {
//   try {
//     const [rows] = await db.query(
//       "SELECT client_id, company AS clientName FROM client"
//     );

//     res.json(rows);

//   } catch (err) {
//     console.error("Get Clients Error:", err);
//     res.status(500).json({ message: "Database Error" });
//   }
// };


// ================= 3. Get All Clients =================
// This fetches the unique ID, Name, and Address from the 'client' table
exports.getAllClients = async (req, res) => {
  try {
    const sql = "SELECT client_id, company AS clientName, address FROM client WHERE status = 'Active'";
    const [rows] = await db.query(sql);

    // This returns: [{ client_id: 28, clientName: 'Volkswagen', address: 'Pune' }, ...]
    res.json(rows);
  } catch (err) {
    console.error("Get Clients Error:", err);
    res.status(500).json({ message: "Database Error" });
  }
};

// ================= 4. Get Users by Client (FIXED) =================
// This uses the unique client_id to find employees in the 'user' table
exports.getUsersByClient = async (req, res) => {
  try {
    const rawId = req.params.clientId || req.params.clientName;
    
    // This removes "CLT" and converts "0027" into the number 27
    const cleanId = rawId.replace(/[^\d]/g, ''); 

    //console.log("Searching Database for client_id:", cleanId);

    const sql = `
      SELECT 
        user_id AS id, 
        name, 
        role, 
        status 
      FROM user 
      WHERE status = 'Active' AND client_id = ?
    `;
    
    const [filteredUsers] = await db.query(sql, [cleanId]);

    const responseData = filteredUsers.map(u => ({
      id: u.id,
      name: u.name,
      role: u.role,
      status: u.status
    }));

    res.json(responseData);
  } catch (err) {
    console.error("[SERVER ERROR]:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ================= 5. Get QC Performance Data (from addqc table) =================
exports.getQCPerformanceData = async (req, res) => {
  try {
    const sql = `
      SELECT 
        u.user_id,
        u.name AS inspectorName,
        a.id AS qc_id,
        a.partName,
        a.inspectedQty,
        a.acceptedQty,
        a.reworkQty,
        a.rejectedQty,
         COALESCE(
          GROUP_CONCAT(
            CONCAT(r.defect_name, ': ', r.qty) 
            SEPARATOR ' | '
          ), 
          'No Defects'
        ) AS defect_breakdown
      FROM user u
      INNER JOIN addqc a ON u.user_id = a.user_id
      LEFT JOIN reportqc r ON a.id = r.addqc_id
      GROUP BY a.id, u.user_id, u.name, a.partName
      ORDER BY a.created_at DESC
    `;

    const [rows] = await db.query(sql);

    const employeeStats = rows.reduce((acc, row) => {
      let emp = acc.find(e => e.user_id === row.user_id);
      if (!emp) {
        emp = { user_id: row.user_id, name: row.inspectorName, partwise: [] };
        acc.push(emp);
      }

      emp.partwise.push({
        qc_id: row.qc_id,
        part: row.partName,
        inspected: row.inspectedQty || 0,
        accepted: row.acceptedQty || 0,
        rework: row.reworkQty || 0,
        reject: row.rejectedQty || 0,
        defects: row.defect_breakdown 
      });
      return acc;
    }, []);

    res.json({ employeeStats });
  } catch (err) {
    console.error("QC Defect Fetch Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ================= 6. Get Monthly Work Trend (QC Inspections per Month) =================
exports.getMonthlyWorkTrend = async (req, res) => {
    try {
        const { userId, clientId } = req.query; 
        
        let sql = `
            SELECT 
                MONTHNAME(q.created_at) as month, 
                COUNT(*) as workers 
            FROM addqc q
        `;

        // 1. Handle JOIN for Company Filter
        if (clientId) {
            sql += ` JOIN user u ON q.user_id = u.user_id 
                     WHERE u.client_id = ${db.escape(clientId)} `;
        } else if (userId) {
            sql += ` WHERE q.user_id = ${db.escape(userId)} `;
        } else {
            // Default: Show everything
            sql += ` WHERE 1=1 `; 
        }

        // 2. Add the Year Filter to whatever path was taken above
        sql += ` AND YEAR(q.created_at) = YEAR(CURDATE()) `;

        // 3. Final Grouping and Ordering
        sql += ` GROUP BY YEAR(q.created_at), MONTH(q.created_at), MONTHNAME(q.created_at) 
                 ORDER BY MONTH(q.created_at) ASC `;

        const [rows] = await db.query(sql);
        res.status(200).json({ success: true, monthlyData: rows });
    } catch (error) {
        console.error("SQL Error:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};



// EMPLOYEE DASHBOARD CONTROLLER

// /// ===============================
// // SUPERVISOR DASHBOARD API
// // ===============================

exports.getSupervisorDashboard = async (req, res) => {
  try {
    const userId = req.user.user_id; // ✅ FIXED
    const today = new Date().toISOString().split("T")[0];

    // console.log("Logged-in User ID:", userId);

    // ===============================
    // TODAY DATA
    // ===============================
    const [todayData] = await db.query(
      `
      SELECT 
        SUM(inspectedQty) AS today_inspected,
        SUM(acceptedQty) AS today_accepted,
        SUM(rejectedQty) AS today_rejected,
        SUM(reworkQty) AS today_rework
      FROM addqc
      WHERE DATE(created_at) = ?
      AND user_id = ?
      `,
      [today, userId]
    );

    
    // ===============================
    // 2. MONTHLY DATA (Current Month Only)
    // ===============================
    const [monthlyData] = await db.query(
      `
      SELECT 
        SUM(inspectedQty) AS month_inspected,
        SUM(acceptedQty) AS month_accepted,
        SUM(rejectedQty) AS month_rejected,
        SUM(reworkQty) AS month_rework
      FROM addqc
      WHERE user_id = ? 
      AND MONTH(created_at) = MONTH(CURRENT_DATE())
      AND YEAR(created_at) = YEAR(CURRENT_DATE())
      `,
      [userId]
    );
    res.json({
      today_inspected: Number(todayData[0].today_inspected) || 0,
      today_accepted: Number(todayData[0].today_accepted) || 0,
      today_rejected: Number(todayData[0].today_rejected) || 0,
      today_rework: Number(todayData[0].today_rework) || 0,

     // Monthly Stats (Replaced "Total" with "Month")
      total_inspected: Number(monthlyData[0].month_inspected) || 0,
      total_accepted: Number(monthlyData[0].month_accepted) || 0,
      total_rejected: Number(monthlyData[0].month_rejected) || 0,
      total_rework: Number(monthlyData[0].month_rework) || 0,
    });

  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};