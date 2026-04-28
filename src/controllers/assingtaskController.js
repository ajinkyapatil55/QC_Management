const db = require("../config/db");

// ================= GET HR MANAGERS BY COMPANY =================
exports.getHRManagersByCompany = async (req, res) => {
    try {
        const client_id = req.user?.client_id || req.params.companyId;

        if (!client_id || client_id === 'undefined') {
            return res.status(400).json({
                success: false,
                message: "client_id is missing or undefined"
            });
        }

        const sql = `
            SELECT 
                user_id, 
                name AS employeeName, 
                username, 
                email_id AS email,
                role
            FROM user 
            WHERE client_id = ? 
                AND role = 'ROLE_HR' 
                AND status = 'Active'
            ORDER BY name ASC
        `;

        const [hrManagers] = await db.query(sql, [client_id]);

        res.status(200).json({
            success: true,
            data: hrManagers
        });

    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

// ================= CREATE ASSIGNMENT =================
exports.createAssignment = async (req, res) => {
    const { companyId, partId, inspectors, managers, type } = req.body;

    if (!companyId || !partId || !inspectors || !Array.isArray(inspectors) || inspectors.length === 0) {
        return res.status(400).json({
            success: false,
            message: "Validation Failed: Missing required fields."
        });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const singleManagerId = Array.isArray(managers) ? managers[0] : managers;

        if (!singleManagerId) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ success: false, message: "No Manager assigned." });
        }

        const assignSql = `
            INSERT INTO assignments (client_id, part_id, manager_id, assignment_type, status) 
            VALUES (?, ?, ?, ?, 'Active')
        `;

        const [result] = await connection.query(assignSql, [
            Number(companyId),
            Number(partId),
            Number(singleManagerId),
            type
        ]);

        const newAssignmentId = result.insertId;

        const inspectorData = inspectors.map(insId => [
            newAssignmentId,
            Number(insId)
        ]);

        const inspectorSql = `INSERT INTO assignment_inspectors (assignment_id, inspector_id) VALUES ?`;
        await connection.query(inspectorSql, [inspectorData]);

        await connection.commit();
        res.status(201).json({ success: true, message: "Task Assigned Successfully!" });

    } catch (error) {
        await connection.rollback();
        console.error("SAVE ERROR DETAILS:", error.message);
        res.status(500).json({ success: false, message: "Database Error: " + error.message });
    } finally {
        connection.release();
    }
};

// ================= GET ALL ASSIGNMENTS (Filtered by Company) =================
exports.getAllAssignments = async (req, res) => {
    const adminClientId = req.user?.client_id;

    try {
        const sql = `
            SELECT 
                a.id, 
                a.assignment_type AS type,
                a.part_id,
                p.partName,
                u_mgr.name AS managerName,
                GROUP_CONCAT(DISTINCT u_ins.name ORDER BY u_ins.name SEPARATOR ', ') AS inspectorName,
                GROUP_CONCAT(DISTINCT ai.inspector_id ORDER BY ai.inspector_id SEPARATOR ',') AS inspectorIds,
                GROUP_CONCAT(ai.status SEPARATOR ', ') AS status,
                a.created_at,
                MAX(ai.updated_at) AS updated_at
            FROM assignments a
            JOIN assignment_inspectors ai ON a.id = ai.assignment_id
            JOIN user u_ins ON ai.inspector_id = u_ins.user_id
            LEFT JOIN parts p ON a.part_id = p.id
            LEFT JOIN user u_mgr ON a.manager_id = u_mgr.user_id
            WHERE a.client_id = ?
            GROUP BY a.id, a.assignment_type, a.part_id, p.partName, u_mgr.name, a.created_at
            ORDER BY a.created_at DESC
        `;

        const [rows] = await db.query(sql, [adminClientId]);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("SQL Error in getAllAssignments:", error.message);
        res.status(500).json({ success: false, message: "Error fetching assignments" });
    }
};

// ================= DELETE ASSIGNMENT =================
exports.deleteAssignment = async (req, res) => {
    const { id } = req.params;
    try {
        const sql = `DELETE FROM assignments WHERE id = ?`;
        await db.query(sql, [id]);
        res.status(200).json({ success: true, message: "Assignment deleted" });
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ success: false, message: "Failed to delete" });
    }
};

// ================= GET ASSIGNMENT COUNT FOR BADGE =================
exports.getAssignmentCount = async (req, res) => {
    const { inspectorId } = req.params;
    const adminClientId = req.user?.client_id;

    try {
        const sql = `
            SELECT COUNT(*) as count 
            FROM assignment_inspectors ai
            JOIN assignments a ON ai.assignment_id = a.id
            WHERE ai.inspector_id = ? 
            AND a.client_id = ?
            AND (LOWER(ai.status) = 'pending' OR ai.status IS NULL)
        `;
        const [rows] = await db.query(sql, [inspectorId, adminClientId]);
        res.status(200).json({ success: true, count: rows[0].count });
    } catch (error) {
        console.error("Count Error:", error);
        res.status(500).json({ success: false, message: "Error fetching count" });
    }
};

// ================= GET DETAILED ASSIGNMENTS FOR NOTIF BOX =================
exports.getMyAssignments = async (req, res) => {
    const { inspectorId } = req.params;
    const adminClientId = req.user?.client_id;

    if (!inspectorId || inspectorId === "null" || inspectorId === "undefined") {
        return res.status(400).json({ success: false, message: "Valid Inspector ID is required" });
    }

    try {
        const sql = `
            SELECT 
                a.id, 
                a.assignment_type,
                p.partName AS part_name,
                cl.company AS client_name,
                ai.status AS current_status
            FROM assignments a
            JOIN assignment_inspectors ai ON a.id = ai.assignment_id
            LEFT JOIN parts p ON a.part_id = p.id
            LEFT JOIN client cl ON a.client_id = cl.id
            WHERE ai.inspector_id = ? 
            AND a.client_id = ?
            ORDER BY a.created_at DESC
        `;

        const [rows] = await db.query(sql, [inspectorId, adminClientId]);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Database Error Detail:", error.message);
        res.status(500).json({ success: false, message: "Server error fetching tasks" });
    }
};

// ================= UPDATE ASSIGNMENT STATUS =================
exports.updateAssignmentStatus = async (req, res) => {
    const { assignmentId, status, inspectorId } = req.body;
    try {
        const sql = `
            UPDATE assignment_inspectors 
            SET status = ?, updated_at = NOW() 
            WHERE assignment_id = ? AND inspector_id = ?
        `;
        const [result] = await db.query(sql, [status, assignmentId, inspectorId]);
        res.status(200).json({ success: true, message: `Assignment ${status} successfully` });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update status" });
    }
};

// ================= GET USER DETAILS BY TASK =================
exports.getUserDetailsTask = async (req, res) => {
    try {
        const authUserId = req.user.user_id || req.user.id;

        if (!authUserId) {
            return res.status(401).json({ success: false, message: "User ID not found in token" });
        }

        const sql = `
            SELECT 
                u.user_id, 
                u.username, 
                u.name, 
                u.contact_no1, 
                u.clientName,
                c.address AS clientAddress
            FROM \`user\` AS u
            LEFT JOIN \`client\` AS c ON u.client_id = c.id
            WHERE u.user_id = ?
        `;

        const [rows] = await db.query(sql, [authUserId]);

        if (rows.length > 0) {
            const userData = rows[0];
            res.status(200).json({
                success: true,
                user: {
                    user_id: userData.user_id,
                    username: userData.username,
                    name: userData.name,
                    contact_no1: userData.contact_no1,
                    clientName: userData.clientName,
                    address: userData.clientAddress
                }
            });
        } else {
            res.status(404).json({ success: false, message: "User not found" });
        }
    } catch (error) {
        console.error("User Details Error:", error);
        res.status(500).json({ success: false, message: "Error fetching profile" });
    }
};