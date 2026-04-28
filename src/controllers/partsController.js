const db = require("../config/db");

// ================= Get All Parts (company-restricted) =================
exports.getAllParts = async (req, res) => {
  try {
    if (!req.user || !req.user.client_id || !req.user.company) {
      return res.status(401).json({ message: "Unauthorized: no company found" });
    }

    const userCompany = req.user.client_id;
    // console.log("Fetching parts for company:", userCompany);

    const sql = "SELECT * FROM parts WHERE client_id=? ORDER BY id DESC";
    const [rows] = await db.query(sql, [userCompany]); // use db.query, not pool.query

    // // console.log(`Found ${rows.length} parts for ${userCompany}`);
    res.json(rows);
  } catch (err) {
    console.error("Get Parts Error:", err);
    res.status(500).json({ message: "Database Error", error: err.message });
  }
};

// ================= Save Part =================
exports.savePart = async (req, res) => {
    try {
        // Use company from request body OR fallback to JWT
        const company = req.body.company || req.user?.company;
        const client_id = req.user?.client_id; // fetch client_id from logged-in user
        const { partName, partNumber, category, description } = req.body;

        // Validation
        if (!company || !client_id || !partName || !partNumber || !category || !description) {
            return res.status(400).send({ message: "All fields are required" });
        }

        // Check duplicate partNumber for same company
        const [existing] = await db.query(
            "SELECT * FROM parts WHERE partNumber=? AND company=?",
            [partNumber, company]
        );
        if (existing.length > 0) {
            return res.status(400).send({ message: "Part number already exists for this company" });
        }

        const sql = `
            INSERT INTO parts (company, client_id, partName, partNumber, category, description)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        await db.query(sql, [company, client_id, partName, partNumber, category, description]);

        res.send({ message: "Part saved successfully" });
    } catch (err) {
        console.error("Save Part Error:", err);
        res.status(500).send({ message: err.message || "Insert failed" });
    }
};

// ================= Update Part =================
exports.updatePart = async (req, res) => {
    try {
        const { id, company, partName, partNumber, category, description } = req.body;

        if (!id || !company || !partName || !partNumber || !category || !description) {
            return res.status(400).send({ message: "All fields are required" });
        }

        // Check if the part exists for this company
        const [existingParts] = await db.query(
            "SELECT * FROM parts WHERE id=? AND company=?",
            [id, company]
        );

        if (existingParts.length === 0) {
            return res.status(404).send({ message: "Part not found or unauthorized" });
        }

        // Check duplicate partNumber for same company
        const [duplicate] = await db.query(
            "SELECT * FROM parts WHERE partNumber=? AND id!=? AND company=?",
            [partNumber, id, company]
        );

        if (duplicate.length > 0) {
            return res.status(400).send({ message: "Part number already exists in this company" });
        }

        // Update the part
        await db.query(
            "UPDATE parts SET partName=?, partNumber=?, category=?, description=?, updated_at=NOW() WHERE id=? AND company=?",
            [partName, partNumber, category, description, id, company]
        );

        res.send({ message: "Part updated successfully" });

    } catch (err) {
        console.error("Update Part Error:", err);
        res.status(500).send({ message: err.message || "Update failed" });
    }
};


// ================= Get Single Part =================
exports.getPartDetails = async (req, res) => {
    try {
        const id = req.params.id;

        // remove company check temporarily
        const [rows] = await db.query("SELECT * FROM parts WHERE id=?", [id]);

        if (rows.length === 0)
            return res.status(404).send({ message: "Part not found" });

        res.json(rows[0]);
    } catch (err) {
        console.error("Get Part Details Error:", err);
        res.status(500).send("Database Error");
    }
};


// ================= Delete Part =================
exports.deletePart = async (req, res) => {
    try {
        const id = req.params.id;
        // console.log("DELETE PART ID:", id);

        // Check if part exists
        const [existing] = await db.query(
            "SELECT * FROM parts WHERE id=?",
            [id]
        );
        // console.log("Part found:", existing);

        if (existing.length === 0) {
            return res.status(404).send({ message: "Part not found" });
        }

        // Delete the part
        await db.query("DELETE FROM parts WHERE id=?", [id]);
        res.send({ message: "Part Deleted Successfully" });
    } catch (err) {
        console.error("Delete Part Error:", err);
        res.status(500).send({ message: "Delete Failed" });
    }
};


// // ================= Get Parts by Company (FOR DROPDOWN) =================
// exports.getPartsByCompany = async (req, res) => {
//     try {
//         const company = req.params.company;

//         const [rows] = await db.query(
//             "SELECT id, partName FROM parts WHERE company=? ORDER BY partName ASC",
//             [company]
//         );

//         res.json(rows);
//     } catch (err) {
//         console.error("Get Parts By Company Error:", err);
//         res.status(500).send({ message: "Database Error" });
//     }
// };


// ================= Get Parts by Client ID (STRICT DROPDOWN) =================
exports.getPartsByCompany = async (req, res) => {
    try {
        // 1. Get the client_id from the authenticated token
        // This prevents User A from seeing User B's parts by changing the URL
        const loggedInClientId = req.user?.client_id;

        if (!loggedInClientId) {
            return res.status(401).json({ message: "Unauthorized: No client context found" });
        }

        // 2. Fetch parts ONLY for this specific client_id
        const [rows] = await db.query(
            "SELECT id, partName FROM parts WHERE client_id = ? ORDER BY partName ASC",
            [loggedInClientId]
        );

        res.json(rows);
    } catch (err) {
        console.error("Get Parts By Client Error:", err);
        res.status(500).json({ message: "Database Error" });
    }
};




// ================= Get Current User Company =================
exports.getUserCompany = async (req, res) => {
    try {
        // 1️⃣ Check if JWT middleware attached user to request
        if (!req.user) {
            console.log("Unauthorized access attempt: no user in req");
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        // 2️⃣ Log the user ID for debugging
        console.log("Logged-in user ID:", req.user.user_id || req.user.id); // adapt field name based on your JWT payload
        console.log("Full user object:", req.user);

        // 3️⃣ Get company assigned to this user
        const userCompany = req.user.company;

        if (!userCompany) {
            console.log("User has no company assigned:", req.user.user_id || req.user.id);
            return res.status(404).json({ success: false, message: "User company not found" });
        }

        // 4️⃣ Return company
        console.log("Returning company for user:", req.user.user_id || req.user.id, userCompany);
        res.status(200).json({
            success: true,
            data: { company: userCompany },
        });
    } catch (err) {
        console.error("Get User Company Error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message,
        });
    }
};