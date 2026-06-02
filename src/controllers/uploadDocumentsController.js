// Ensure your relative path accurately targets your centralized database pool instance
const db = require("../config/db");

// =========================================================================
// UPLOAD / UPDATE EMPLOYEE DOCUMENTS (UPSERT PATTERN)
// Stores or replaces foundational verification base64 asset packets safely
// =========================================================================
exports.uploadEmployeeDocuments = async (req, res) => {
    try {
        // 1. Resolve and validate the security context mapping from the auth middleware pipeline
        const targetUserId = req.user?.user_id || req.user?.id;

        if (!targetUserId) {
            return res.status(401).json({
                success: false,
                message: "Authentication failed: Authorized user profile identifier could not be resolved from token payload context."
            });
        }

        // 2. Extract payload variables from request body parsing layer
        const {
            aadhar, 
            pan, 
            photo, 
            joiningLetter,
            aadharName, 
            panName, 
            photoName, 
            joiningLetterName
        } = req.body;

        // 3. Comprehensive Data Presence Validations
        if (
            !aadhar?.trim() || !aadharName?.trim() ||
            !pan?.trim() || !panName?.trim() ||
            !photo?.trim() || !photoName?.trim() ||
            !joiningLetter?.trim() || !joiningLetterName?.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Validation Failed: All 4 data payloads and corresponding file names must be provided with content values."
            });
        }

        // 4. Check if a dossier record exists to determine whether to INSERT or UPDATE
        const checkSql = "SELECT doc_id FROM employee_documents WHERE user_id = ? LIMIT 1";
        const [existingDossier] = await db.query(checkSql, [targetUserId]);

        if (existingDossier && existingDossier.length > 0) {
            // EXECUTE UPDATE: Overwrite existing paths seamlessly
            const updateSql = `
                UPDATE employee_documents 
                SET 
                    aadhar_data = ?, 
                    aadhar_filename = ?, 
                    pan_data = ?, 
                    pan_filename = ?, 
                    photo_data = ?, 
                    photo_filename = ?, 
                    joining_letter_data = ?, 
                    joining_letter_filename = ?
                WHERE user_id = ?
            `;
            
            const updateParams = [
                aadhar.trim(),
                aadharName.trim(),
                pan.trim(),
                panName.trim(),
                photo.trim(),
                photoName.trim(),
                joiningLetter.trim(),
                joiningLetterName.trim(),
                Number(targetUserId)
            ];

            await db.query(updateSql, updateParams);

            return res.status(200).json({
                success: true,
                message: "Your validation dossier record entries have been successfully modified and updated."
            });
        } else {
            // EXECUTE INSERT: Fallback for brand-new records
            const insertSql = `
                INSERT INTO employee_documents (
                    user_id, 
                    aadhar_data, 
                    aadhar_filename, 
                    pan_data, 
                    pan_filename, 
                    photo_data, 
                    photo_filename, 
                    joining_letter_data, 
                    joining_letter_filename
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const insertParams = [
                Number(targetUserId), 
                aadhar.trim(),
                aadharName.trim(),
                pan.trim(),
                panName.trim(),
                photo.trim(),
                photoName.trim(),
                joiningLetter.trim(),
                joiningLetterName.trim()
            ];

            await db.query(insertSql, insertParams);

            return res.status(200).json({
                success: true,
                message: "Your validation dossier has been compiled, checked, and saved successfully."
            });
        }

    } catch (error) {
        console.error("========================================================");
        console.error("CRITICAL RUNTIME BLOCKAGE IN uploadEmployeeDocuments");
        console.error("SQL Error Code ID:", error.code || "N/A");
        console.error("Exact Core Message:", error.message);
        console.error("========================================================");
        
        return res.status(500).json({
            success: false,
            message: `A system database error occurred while registering upload packets downstream: ${error.message}`
        });
    }
};

// =========================================================================
// GET EMPLOYEE DOCUMENTS BY USER ID
// Pulls the complete Base64 verification streams for a specified target user
// =========================================================================
exports.getEmployeeDocumentsById = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId || userId === "undefined" || userId === "null") {
            return res.status(400).json({ success: false, message: "Invalid ID" });
        }

        // REMOVED 'created_at' from this list because it does not exist in your table
        const fetchSql = `
            SELECT 
                doc_id,
                user_id,
                aadhar_data, 
                aadhar_filename, 
                pan_data, 
                pan_filename, 
                photo_data, 
                photo_filename, 
                joining_letter_data, 
                joining_letter_filename
            FROM employee_documents 
            WHERE user_id = ? 
            LIMIT 1
        `;

        const [rows] = await db.query(fetchSql, [Number(userId)]);

        if (!rows || rows.length === 0) {
            return res.status(200).json({
                success: false,
                message: "No document found.",
                data: null
            });
        }

        return res.status(200).json({
            success: true,
            data: rows[0]
        });

    } catch (error) {
        // ... (rest of your error handling)
    }
};