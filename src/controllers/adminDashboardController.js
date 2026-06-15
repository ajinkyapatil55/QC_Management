const db = require("../config/db");

// ================================================================
// adminDashboardController.js
// ALL queries are locked to the logged-in admin's company
// client_id is ALWAYS read from req.user.client_id (JWT token)
// Frontend never sends client_id — so no other company data leaks
// ================================================================


// 1. Get Parts — only this admin's company parts
exports.getAdminParts = async (req, res) => {
    try {
        const client_id = req.user.client_id; // ← from JWT token

        const [parts] = await db.query(
            "SELECT id, partName AS part_name FROM parts WHERE client_id = ? ORDER BY partName ASC",
            [client_id]
        );

        res.status(200).json(parts);
    } catch (error) {
        console.error("Admin Parts Error:", error);
        res.status(500).json({ message: "Error fetching parts" });
    }
};


// 2. Get Inspectors — only inspectors who worked for this admin's company
exports.getAdminInspectors = async (req, res) => {
    try {
        const client_id = req.user.client_id; // ← from JWT token

        const [inspectors] = await db.query(
            `SELECT DISTINCT TRIM(inspectorName) as inspectorName 
             FROM addqc 
             WHERE client_id = ? 
             ORDER BY inspectorName ASC`,
            [client_id]
        );

        const list = inspectors.map(row => row.inspectorName).filter(n => n);
        res.status(200).json(list);
    } catch (error) {
        console.error("Admin Inspectors Error:", error);
        res.status(500).json({ message: "Error fetching inspectors" });
    }
};


// 3. Main Admin Dashboard Data — LOCKED to admin's own company
exports.getAdminDashboardData = async (req, res) => {
    try {
        const client_id = req.user.client_id; // ← ALWAYS from JWT, never from frontend

        const { 
            part_id, inspector, 
            dateMode, month, year, 
            singleDate, startDate, endDate 
        } = req.query;

        // client_id is HARDCODED as first condition — cannot be overridden
        let whereClause = "WHERE a.client_id = ?";
        let params      = [client_id];

        // --- Optional Filters (FIXED: Fallback support if frontend transmits the partName instead of an ID number) ---
        if (part_id && part_id !== '' && part_id !== 'all' && part_id !== 'undefined') {
            if (isNaN(part_id)) {
                whereClause += " AND a.partName = ?";
                params.push(part_id);
            } else {
                whereClause += " AND a.partName = (SELECT partName FROM parts WHERE id = ? LIMIT 1)";
                params.push(part_id);
            }
        }

        if (inspector && inspector !== "All Inspectors" && inspector !== 'undefined') {
            whereClause += " AND TRIM(a.inspectorName) = TRIM(?)";
            params.push(inspector);
        }

        // --- Date Filter ---
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

        // --- Stats ---
        const [statsResult] = await db.query(`
            SELECT 
                SUM(CAST(inspectedQty AS SIGNED)) as inspected,
                SUM(CAST(acceptedQty AS SIGNED))  as accepted,
                SUM(CAST(reworkQty AS SIGNED))    as rework,
                SUM(CAST(rejectedQty AS SIGNED))  as rejected
            FROM addqc a ${whereClause}
        `, params);

        const s     = statsResult[0] || {};
        const total = parseFloat(s.inspected) || 0;

        const stats = {
            inspected:    total,
            accepted:     parseFloat(s.accepted) || 0,
            rework:       parseFloat(s.rework)    || 0,
            rejected:     parseFloat(s.rejected) || 0,
            reworkPPM:    total > 0 ? Math.round(((parseFloat(s.rework)    || 0) / total) * 1000000) : 0,
            rejectionPPM: total > 0 ? Math.round(((parseFloat(s.rejected) || 0) / total) * 1000000) : 0,
        };

        // --- Production Trend (FIXED GROUP BY) ---
        const [graphical] = await db.query(`
            SELECT 
                DATE_FORMAT(a.created_at, '%Y-%m-%d') as name,
                a.partName,
                MAX(a.inspectorName) as inspectorName,
                SUM(a.inspectedQty)  as inspected,
                SUM(a.acceptedQty)   as accepted,
                SUM(a.reworkQty)     as rework,
                SUM(a.rejectedQty)   as rejected
            FROM addqc a ${whereClause}
            GROUP BY DATE_FORMAT(a.created_at, '%Y-%m-%d'), a.partName
            ORDER BY name ASC
        `, params);

        // --- Location Comparison ---
        const [locationComparison] = await db.query(`
            SELECT 
                a.location, 
                SUM(a.inspectedQty) as inspected
            FROM addqc a ${whereClause}
            GROUP BY a.location
        `, params);

        // --- Part Quality Split ---
        const [partQualitySplit] = await db.query(`
            SELECT 
                a.partName,
                SUM(a.acceptedQty) as accepted,
                SUM(a.reworkQty)   as rework,
                SUM(a.rejectedQty) as rejected
            FROM addqc a ${whereClause}
            GROUP BY a.partName
        `, params);

        // --- Day Wise (FIXED GROUP BY) ---
        const [dayWise] = await db.query(`
            SELECT 
                DATE_FORMAT(a.created_at, '%Y-%m-%d') as date,
                MAX(a.inspectorName) as inspectorName,
                MAX(a.partName)      as partName,
                SUM(a.inspectedQty)  as inspected,
                SUM(a.acceptedQty)   as accepted,
                SUM(a.reworkQty)     as rework,
                SUM(a.rejectedQty)   as rejected
            FROM addqc a ${whereClause}
            GROUP BY DATE_FORMAT(a.created_at, '%Y-%m-%d')
            ORDER BY date DESC
        `, params);

        // --- Part Wise ---
        const [partWise] = await db.query(`
            SELECT 
                a.partName as part_name,
                MAX(DATE_FORMAT(a.created_at, '%Y-%m-%d')) as date,
                MAX(a.inspectorName) as inspectorName,
                SUM(a.inspectedQty)  as inspected,
                SUM(a.acceptedQty)   as accepted,
                SUM(a.reworkQty)     as rework,
                SUM(a.rejectedQty)   as rejected
            FROM addqc a ${whereClause}
            GROUP BY a.partName
        `, params);

        // --- Full Inspection Report ---
        const [report] = await db.query(`
            SELECT 
                a.id, a.inspectorName,
                a.inspectedQty, a.acceptedQty, a.reworkQty, a.rejectedQty,
                a.total, a.partName, a.shift, a.location,
                DATE_FORMAT(a.created_at, '%Y-%m-%d') as date
            FROM addqc a ${whereClause}
            ORDER BY a.id DESC
        `, params);

        // --- Top 5 Defects ---
        const [defectResults] = await db.query(`
            SELECT 
                r.defect_name as defectName,
                SUM(r.qty)    as count,
                a.partName,
                a.inspectorName
            FROM reportqc r
            INNER JOIN addqc a ON r.addqc_id = a.id
            ${whereClause}
            GROUP BY r.defect_name, a.partName, a.inspectorName
            ORDER BY count DESC
            LIMIT 5
        `, params);

        // --- Send Response ---
        res.status(200).json({
            stats,
            graphical,
            locationComparison,
            partQualitySplit,
            dayWise,
            partWise,
            report,
            topDefects: defectResults,
        });

    } catch (error) {
        console.error("Admin Dashboard Error:", error);
        res.status(500).json({ message: "Admin dashboard error", error: error.message });
    }
};