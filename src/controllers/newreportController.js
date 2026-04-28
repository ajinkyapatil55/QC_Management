const db = require("../config/db");

// ================= Get All Reports =================
exports.getAllReports = async (req, res) => {
    try {
        const sql = "SELECT * FROM new_report ORDER BY id DESC";
        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (err) {
        console.error("Get Reports Error:", err);
        res.status(500).send({ message: "Database Error" });
    }
};

// ================= Save Report =================
exports.saveReport = async (req, res) => {
    try {
        const { company, partName, processName, note } = req.body;

        const sql = `
            INSERT INTO new_report (company, partName, processName, note)
            VALUES (?, ?, ?, ?)
        `;
        await db.query(sql, [company, partName, processName, note]);
        res.send({ message: "Report Saved Successfully" });
    } catch (err) {
        console.error("Save Report Error:", err);
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).send({ message: "This report already exists." });
        }
        res.status(500).send({ message: "Database Error" });
    }
};

// ================= Update Report =================
exports.updateReport = async (req, res) => {
    try {
        const { id, company, partName, processName, note } = req.body;

        const sql = `
            UPDATE new_report
            SET company=?, partName=?, processName=?, note=?
            WHERE id=?
        `;
        await db.query(sql, [company, partName, processName, note, id]);
        res.send({ message: "Report Updated Successfully" });
    } catch (err) {
        console.error("Update Report Error:", err);
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).send({ message: "This report already exists." });
        }
        res.status(500).send({ message: "Database Error" });
    }
};

// ================= Get Single Report =================
exports.getReportById = async (req, res) => {
    try {
        const id = req.params.id;
        const sql = "SELECT * FROM new_report WHERE id=?";
        const [rows] = await db.query(sql, [id]);

        if (rows.length === 0) {
            return res.status(404).send({ message: "Report not found" });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error("Get Report Error:", err);
        res.status(500).send({ message: "Database Error" });
    }
};

// ================= Delete Report =================
exports.deleteReport = async (req, res) => {
    try {
        const id = req.params.id;
        const sql = "DELETE FROM new_report WHERE id=?";
        await db.query(sql, [id]);
        res.send({ message: "Report Deleted Successfully" });
    } catch (err) {
        console.error("Delete Report Error:", err);
        res.status(500).send({ message: "Database Error" });
    }
};
