const db = require("../config/db");

// 1. Fetch All Clients
// exports.getAllClientsOwner = async (req, res) => {
//     try {
//         const sql = "SELECT id, company FROM client ORDER BY company DESC";
//         const [clients] = await db.query(sql);
//         res.status(200).json(clients);
//     } catch (error) {
//         res.status(500).json({ message: "Error fetching clients" });
//     }
// };


// 1. Fetch All Clients (Including Address)
exports.getAllClientsOwner = async (req, res) => {
    try {
        // Added 'address' to the SELECT statement
        const sql = "SELECT id, company, address FROM client ORDER BY company ASC"; 
        
        const [clients] = await db.query(sql);
        
        res.status(200).json(clients);
    } catch (error) {
        console.error("Error fetching clients:", error);
        res.status(500).json({ message: "Error fetching clients" });
    }
};


// 2. Fetch Parts - Chained to Client
exports.getPartsByClient = async (req, res) => {
    try {
        const { client_id } = req.params;
        let sql = "SELECT id, partName AS part_name FROM parts";
        let params = [];

        if (client_id && client_id !== 'all') {
            sql += " WHERE client_id = ?";
            params.push(client_id);
        }
        sql += " ORDER BY partName ASC";

        const [parts] = await db.query(sql, params);
        res.status(200).json(parts);
    } catch (error) {
        res.status(500).json({ message: "Error fetching parts" });
    }
};

// 3. Fetch Unique Inspectors - Chained to Client
// exports.getInspectorsByClient = async (req, res) => {
//     try {
//         const { client_id } = req.params;
//         let sql = "SELECT DISTINCT inspectorName FROM addqc";
//         let params = [];

//         if (client_id && client_id !== 'all') {
//             sql += " WHERE client_id = ?";
//             params.push(client_id);
//         }
//         sql += " ORDER BY inspectorName ASC";

//         const [inspectors] = await db.query(sql, params);
//         const list = inspectors.map(row => row.inspectorName).filter(n => n);
//         res.status(200).json(list);
//     } catch (error) {
//         res.status(500).json({ message: "Error fetching inspectors" });
//     }
// };

exports.getInspectorsByClient = async (req, res) => {
    try {
        const { client_id } = req.params; // This will be "all" if 'All Companies' is selected
        let sql = "SELECT DISTINCT TRIM(inspectorName) as inspectorName FROM addqc";
        let params = [];

        // This condition is key: 
        // If client_id is "all", it skips this block and runs the query on the WHOLE table
        if (client_id && client_id !== 'all' && client_id !== 'undefined') {
            sql += " WHERE client_id = ?";
            params.push(client_id);
        }

        sql += " ORDER BY inspectorName ASC";

        const [inspectors] = await db.query(sql, params);
        const list = inspectors.map(row => row.inspectorName).filter(n => n);
        
        res.status(200).json(list);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching inspectors" });
    }
};


// 4. Fetch Dashboard Data with Chained Filters and Date Logic

exports.getOwnerDashboardData = async (req, res) => {
    try {
        const { client_id, part_id, inspector, dateMode, month, year, singleDate, startDate, endDate } = req.query;

        let whereClause = "WHERE 1=1";
        let params = [];

        // --- 1. Filter Logic ---
        if (client_id && client_id !== 'all') {
            whereClause += " AND a.client_id = ?";
            params.push(client_id);
        }
        if (part_id && part_id !== 'all') {
            // FIX: Changed 'part_name' to 'partName' to match your 'parts' table column
            whereClause += " AND a.partName = (SELECT partName FROM parts WHERE id = ? LIMIT 1)";
            params.push(part_id);
        }
        if (inspector && inspector !== "All Inspectors") {
            whereClause += " AND a.inspectorName = ?";
            params.push(inspector);
        }

        // --- 2. Date Logic ---
        if (dateMode === "Month") {
            whereClause += " AND MONTHNAME(a.created_at) = ? AND YEAR(a.created_at) = ?";
            params.push(month, year);
        } else if (dateMode === "Single Day") {
            whereClause += " AND DATE(a.created_at) = ?";
            params.push(singleDate);
        } else if (dateMode === "Date Range") {
            whereClause += " AND DATE(a.created_at) BETWEEN ? AND ?";
            params.push(startDate, endDate);
        }

        // --- 3. Stats Query ---
        const [statsResult] = await db.query(`
            SELECT 
                SUM(inspectedQty) as inspected, 
                SUM(acceptedQty) as accepted, 
                SUM(reworkQty) as rework, 
                SUM(rejectedQty) as rejected 
            FROM addqc a ${whereClause}
        `, params);

        const s = statsResult[0] || {};
        const total = parseFloat(s.inspected) || 0;

        const stats = {     
            inspected: total,
            accepted: parseFloat(s.accepted) || 0,
            rework: parseFloat(s.rework) || 0,
            rejected: parseFloat(s.rejected) || 0,
            reworkPPM: total > 0 ? Math.round(((parseFloat(s.rework) || 0) / total) * 1000000) : 0,
            rejectionPPM: total > 0 ? Math.round(((parseFloat(s.rejected) || 0) / total) * 1000000) : 0
        };

        // --- 4. Detailed Data Queries ---

        // Trend Data (Production Trend Analysis)
        const [graphical] = await db.query(`
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m-%d') as name, 
                partName, 
                MAX(inspectorName) as inspectorName, 
                SUM(inspectedQty) as inspected, 
                SUM(acceptedQty) as accepted, 
                SUM(reworkQty) as rework, 
                SUM(rejectedQty) as rejected 
            FROM addqc a ${whereClause} 
            GROUP BY name, partName 
            ORDER BY name ASC`, params);

        // Location Comparison
        const [locationComparison] = await db.query(`
            SELECT location, SUM(inspectedQty) as inspected 
            FROM addqc a ${whereClause} 
            GROUP BY location`, params);

        // Part Quality Split
        const [partQualitySplit] = await db.query(`
            SELECT partName, SUM(acceptedQty) as accepted, SUM(reworkQty) as rework, SUM(rejectedQty) as rejected 
            FROM addqc a ${whereClause} 
            GROUP BY partName`, params);

        // Day Wise
        const [dayWise] = await db.query(`
            SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date, MAX(inspectorName) as inspectorName, MAX(partName) as partName, SUM(inspectedQty) as inspected, SUM(acceptedQty) as accepted, SUM(reworkQty) as rework, SUM(rejectedQty) as rejected 
            FROM addqc a ${whereClause} GROUP BY date ORDER BY date DESC`, params);

        // Part Wise
        const [partWise] = await db.query(`
            SELECT partName as part_name, MAX(DATE_FORMAT(created_at, '%Y-%m-%d')) as date, MAX(inspectorName) as inspectorName, SUM(inspectedQty) as inspected, SUM(acceptedQty) as accepted, SUM(reworkQty) as rework, SUM(rejectedQty) as rejected 
            FROM addqc a ${whereClause} GROUP BY partName`, params);

        // Report History
        const [report] = await db.query(`
            SELECT id, inspectorName, inspectedQty, acceptedQty, reworkQty, rejectedQty, total, partName, shift, location, DATE_FORMAT(created_at, '%Y-%m-%d') as date 
            FROM addqc a ${whereClause} ORDER BY id DESC`, params);

        // Top 5 Defects
        const [defectResults] = await db.query(`
            SELECT 
                r.defect_name as defectName, 
                SUM(r.qty) as count,
                a.partName,
                a.inspectorName
            FROM reportqc r
            INNER JOIN addqc a ON r.addqc_id = a.id
            ${whereClause}
            GROUP BY r.defect_name, a.partName, a.inspectorName 
            ORDER BY count DESC 
            LIMIT 5
        `, params);

        res.status(200).json({ 
            stats, 
            graphical, 
            locationComparison, 
            partQualitySplit, 
            dayWise, 
            partWise, 
            report, 
            topDefects: defectResults 
        });

    } catch (error) {
        console.error("Backend Error Details:", error);
        res.status(500).json({ message: "Dashboard calculation error", error: error.message });
    }
};