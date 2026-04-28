const pool = require("../config/db");
const fs = require("fs");
const path = require("path");

/* =========================
   Helpers
========================= */
const parseIntOrDefault = (val, def = 0) => {
  try {
    if (val !== null && val !== undefined && val !== "") {
      return parseInt(val);
    }
  } catch { }
  return def;
};

const saveBase64Image = async (base64, fileName) => {
  if (!base64) return "";

  let ext = "";
  let data = "";

  if (base64.includes("jpeg")) {
    ext = ".jpeg";
    data = base64.substring(23);
  } else if (base64.includes("jpg")) {
    ext = ".jpg";
    data = base64.substring(22);
  } else if (base64.includes("png")) {
    ext = ".png";
    data = base64.substring(22);
  } else {
    return "";
  }

  const buffer = Buffer.from(data, "base64");
  const uploadDir = path.join(process.cwd(), "uploadedImages");

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const fullPath = path.join(uploadDir, fileName + ext);
  fs.writeFileSync(fullPath, buffer);

  return `/uploadedImages/${fileName}${ext}`;
};

/* =========================
   AUTH CHECK
========================= */
const checkUser = async (username) => {
  const [[user]] = await pool.query(
    "SELECT * FROM user WHERE username=?",
    [username]
  );
  return user;
};

/* =========================
   GET TENANTS ASC
========================= */
exports.getTenantsAsc = async (req, res) => {
  const user = await checkUser(req.user.username);
  if (!user) return res.status(401).send("User Not Found");

  const { owner_id } = req.body;

  const [rows] = await pool.query(
    "SELECT * FROM tenant WHERE owner_id=? ORDER BY id DESC",
    [owner_id]
  );

  res.json(rows);
};

/* =========================
   GET TENANTS DESC
========================= */
exports.getTenantsDesc = async (req, res) => {
  const user = await checkUser(req.user.username);
  if (!user) return res.status(401).send("User Not Found");

  const { owner_id } = req.body;

  const [rows] = await pool.query(
    "SELECT * FROM tenant WHERE owner_id=? ORDER BY id DESC",
    [owner_id]
  );

  res.json(rows);
};

/* =========================
   GET TENANT BY ID
========================= */
exports.getTenantById = async (req, res) => {
  const user = await checkUser(req.user.username);
  if (!user) return res.status(401).send("User Not Found");

  const { tenant_id, owner_id } = req.body;

  const [[tenant]] = await pool.query(
    "SELECT * FROM tenant WHERE id=? AND owner_id=?",
    [tenant_id, owner_id]
  );

  res.json(tenant || null);
};

/* =========================
   SAVE TENANT
========================= */
exports.saveTenant = async (req, res) => {
  const user = await checkUser(req.user.username);
  if (!user) return res.status(401).send("User Not Found");

  try {
    const d = req.body;

    if (!d.tenant_full_name?.trim()) {
      return res.status(400).send("Tenant name is required");
    }
    if (!/^\d{10}$/.test(d.mobile_no)) {
      return res.status(400).send("Valid 10-digit Mobile number is required");
    }

    const imagePath = await saveBase64Image(
      d.base_image,
      d.aadhar_no
    );

    const startDate = d.period_of_aggrement?.substring(0, 10);
    const endDate = d.maturity_of_aggrement?.substring(0, 10);

    await pool.query(
      `INSERT INTO tenant (
        tenant_full_name, mobile_no, aadhar_no, pan_card, passport,
        previous_address, permanent_address, age,
        no_of_family_members, no_of_family_members_female,
        no_of_family_members_male, no_of_family_members_children,
        period_of_aggrement, maturity_of_aggrement,
        image_path, nature_of_work, office_address_with_contact,
        ref1_name_address_with_contact, ref2_name_address_with_contact,
        agent_name_address_with_contact, status,
        deposit_amt, site_id, site_name, owner_id
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        d.tenant_full_name,
        d.mobile_no,
        d.aadhar_no,
        d.pan_card,
        d.passport,
        d.previous_address,
        d.permanent_address,
        d.age,
        parseIntOrDefault(d.no_of_family_members),
        parseIntOrDefault(d.no_of_family_members_female),
        parseIntOrDefault(d.no_of_family_members_male),
        parseIntOrDefault(d.no_of_family_members_children),
        startDate,
        endDate,
        imagePath,
        d.nature_of_work,
        d.office_address_with_contact,
        d.ref1_name_address_with_contact,
        d.ref2_name_address_with_contact,
        d.agent_name_address_with_contact,
        "NO",
        d.deposit_amt,
        d.site_id,
        d.site_name,
        d.owner_id,
      ]
    );

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

/* =========================
   UPDATE TENANT
========================= */
exports.updateTenant = async (req, res) => {
  const user = await checkUser(req.user.username);
  if (!user) return res.status(401).send("User Not Found");

  try {
    const d = req.body;

    let imagePath = d.image_path;

    if (d.base_image) {
      imagePath = await saveBase64Image(
        d.base_image,
        "tenant_" + d.id
      );
    }

    await pool.query(
      `UPDATE tenant SET
        tenant_full_name=?, mobile_no=?, aadhar_no=?, pan_card=?, passport=?,
        previous_address=?, permanent_address=?, age=?,
        no_of_family_members=?, no_of_family_members_female=?,
        no_of_family_members_male=?, no_of_family_members_children=?,
        period_of_aggrement=?, maturity_of_aggrement=?,
        image_path=?, nature_of_work=?, office_address_with_contact=?,
        ref1_name_address_with_contact=?, ref2_name_address_with_contact=?,
        agent_name_address_with_contact=?, status='NO'
       WHERE id=? AND owner_id=?`,
      [
        d.tenant_full_name,
        d.mobile_no,
        d.aadhar_no,
        d.pan_card,
        d.passport,
        d.previous_address,
        d.permanent_address,
        d.age,
        d.no_of_family_members,
        d.no_of_family_members_female,
        d.no_of_family_members_male,
        d.no_of_family_members_children,
        d.period_of_aggrement,
        d.maturity_of_aggrement,
        imagePath,
        d.nature_of_work,
        d.office_address_with_contact,
        d.ref1_name_address_with_contact,
        d.ref2_name_address_with_contact,
        d.agent_name_address_with_contact,
        d.id,
        d.owner_id,
      ]
    );

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

/* =========================
   NO STATUS TENANTS
========================= */
exports.noStatusTenants = async (req, res) => {
  const user = await checkUser(req.user.username);
  if (!user) return res.status(401).send("User Not Found");

  const { owner_id } = req.body;

  const [rows] = await pool.query(
    `SELECT id, tenant_full_name, site_id, site_name,
            mobile_no, permanent_address, image_path
     FROM tenant WHERE owner_id=? AND status='NO'
     ORDER BY id DESC`,
    [owner_id]
  );

  res.json(rows);
};

/* =========================
   YES STATUS TENANTS
========================= */
exports.yesStatusTenants = async (req, res) => {
  const user = await checkUser(req.user.username);
  if (!user) return res.status(401).send("User Not Found");

  const { owner_id } = req.body;

  const [rows] = await pool.query(
    `SELECT id, tenant_full_name FROM tenant
     WHERE owner_id=? AND status='YES'
     ORDER BY id DESC`,
    [owner_id]
  );

  res.json(rows);
};

/* =========================
   TENANT IMAGE
========================= */
exports.getTenantImage = async (req, res) => {
  const user = await checkUser(req.user.username);
  if (!user) return res.status(401).send("User Not Found");

  const { tenant_id, owner_id } = req.body;

  const [rows] = await pool.query(
    "SELECT base_image FROM tenant WHERE id=? AND owner_id=?",
    [tenant_id, owner_id]
  );

  res.json(rows);
};

/* =========================
   TENANT LEAVING REPORT
========================= */
exports.tenantLeavingReport = async (req, res) => {
  const user = await checkUser(req.user.username);
  if (!user) return res.status(401).send("User Not Found");

  const { owner_id, site_id, start, end } = req.body;

  let sql = `
    SELECT * FROM tenant
    WHERE site_id=? AND owner_id=? AND leaving_date IS NOT NULL
  `;
  const params = [site_id, owner_id];

  if (start && end) {
    sql += " AND leaving_date BETWEEN ? AND ?";
    params.push(start, end);
  }

  sql += " ORDER BY id DESC";

  const [rows] = await pool.query(sql, params);
  res.json(rows);
};

exports.getCounterDetails = async (req, res) => {
  try {
    const { owner_id } = req.body;

    // 1. Validate user
    const [user] = await pool.query(
      "SELECT * FROM user WHERE owner_id = ?",
      [owner_id]
    );

    if (user.length === 0) {
      return res.status(401).json({ message: "User Not Found" });
    }

    const now = new Date();
    const month = now.getMonth() + 1; // JS months start from 0
    const year = now.getFullYear();

    // 2. Monthly Expense
    const [[expenseSum]] = await pool.query(
      `SELECT COALESCE(SUM(amount),0) AS total_expense
       FROM expense
       WHERE MONTH(sys_date)=? AND YEAR(sys_date)=? AND owner_id=?`,
      [month, year, owner_id]
    );

    // 3. Expense List
    const [expenseList] = await pool.query(
      `SELECT *
       FROM expense
       WHERE MONTH(sys_date)=? AND YEAR(sys_date)=? AND owner_id=?
       ORDER BY id DESC`,
      [month, year, owner_id]
    );

    // 4. Monthly Collection
    const [[collection]] = await pool.query(
      `SELECT COALESCE(SUM(total_received),0) AS monthly_collection
       FROM transaction_tbl
       WHERE MONTH(sys_date)=? AND YEAR(sys_date)=?
       AND owner_id=? AND type='receipt'`,
      [month, year, owner_id]
    );

    // 5. Pending Collection
    const [[pending]] = await pool.query(
      `SELECT COALESCE(SUM(total_receivable),0) AS pending_collection
       FROM transaction_tbl
       WHERE owner_id=? AND type='rent'`,
      [owner_id]
    );

    // 6. Active Reminders
    const [reminders] = await pool.query(
      `SELECT *
       FROM reminder
       WHERE owner_id=? AND status='active'
       ORDER BY id DESC`,
      [owner_id]
    );

    // 7. Final Response (DTO equivalent)
    const counterDto = {
      monthly_collection: collection.monthly_collection,
      pending_collection: pending.pending_collection,
      total_expense: expenseSum.total_expense,
      total_reminder: reminders.length,
      expense_list: expenseList,
    };

    return res.status(200).json(counterDto);
  } catch (error) {
    console.error("Counter API Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getTransactionDetails = async (req, res) => {
  try {
    const { owner_id, site_id, month } = req.body;

    // username from JWT (similar to Principal)
    const user_name = req.user.username;

    // 1. Check user
    const [user] = await pool.query(
      "SELECT * FROM user WHERE username = ?",
      [user_name]
    );

    if (user.length === 0) {
      return res.status(401).json({ message: "User Not Found" });
    }

    // 2. Get transaction room details
    const [transactions] = await pool.query(
      `SELECT *
       FROM transaction_tbl
       WHERE site_id = ?
         AND owner_id = ?
         AND month = ?
       ORDER BY id DESC`,
      [site_id, owner_id, month]
    );

    return res.status(200).json(transactions);
  } catch (error) {
    console.error("Transaction Details Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


exports.getRoomsByOwnerAndSite = async (req, res) => {
  try {
    const { owner_id, site_id } = req.body;

    // Principal → JWT user
    const user_name = req.user.username;

    // 1. Validate User
    const [user] = await pool.query(
      "SELECT * FROM user WHERE username = ?",
      [user_name]
    );

    if (user.length === 0) {
      return res.status(401).json({ message: "User Not Found" });
    }

    // 2. Fetch rooms (same as JPQL / native query)
    const [rooms] = await pool.query(
      `SELECT *
       FROM room
       WHERE site_id = ?
         AND owner_id = ?
       ORDER BY room_no ASC`,
      [site_id, owner_id]
    );

    return res.status(200).json(rooms);
  } catch (error) {
    console.error("Room API Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


exports.saveRoomTransaction = async (req, res) => {
  try {
    const user_name = req.user.username;

    // 1. Validate user
    const [user] = await pool.query(
      "SELECT * FROM user WHERE username = ?",
      [user_name]
    );

    if (user.length === 0) {
      return res.status(401).json({ message: "User Not Found" });
    }

    const transaction = req.body;

    // 2. Split main_head_person => "name,id"
    const [tenant_name, tenant_id] = transaction.main_head_person.split(",");

    const room_rent = transaction.room_rent || 0;
    const other_amt = transaction.other_amt || 0;
    const total_receivable = room_rent + other_amt;

    // 3. Insert transaction (Spring save())
    await pool.query(
      `INSERT INTO transaction_tbl
       (owner_id, site_id, room_no, tenant_id, main_head_person,
        room_rent, other_amt, total_receivable, total_received,
        type, narration, account, month, sys_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())`,
      [
        transaction.owner_id,
        transaction.site_id,
        transaction.room_no,
        parseInt(tenant_id),
        tenant_name,
        room_rent,
        other_amt,
        total_receivable,
        0,
        "rent",
        "",
        "NA",
        transaction.month,
      ]
    );

    return res.status(200).json({ message: "Transaction Saved Successfully" });
  } catch (error) {
    console.error("Save Transaction Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


exports.updateRoomTransaction = async (req, res) => {
  try {
    const user_name = req.user.username;

    // 1. Validate user
    const [user] = await pool.query(
      "SELECT * FROM user WHERE username = ?",
      [user_name]
    );

    if (user.length === 0) {
      return res.status(401).json({ message: "User Not Found" });
    }

    const transaction = req.body;

    // 2. Split main_head_person
    const [tenant_name, tenant_id] = transaction.main_head_person.split(",");

    const room_rent = transaction.room_rent || 0;
    const other_amt = transaction.other_amt || 0;
    const total_receivable = room_rent + other_amt;

    // 3. Update query (Spring @Modifying equivalent)
    await pool.query(
      `UPDATE transaction_tbl
       SET room_rent = ?,
           other_amt = ?,
           total_receivable = ?,
           tenant_id = ?,
           main_head_person = ?
       WHERE site_id = ?
         AND owner_id = ?
         AND month = ?
         AND room_no = ?`,
      [
        room_rent,
        other_amt,
        total_receivable,
        parseInt(tenant_id),
        tenant_name,
        transaction.site_id,
        transaction.owner_id,
        transaction.month,
        transaction.room_no,
      ]
    );

    return res.status(200).json({ message: "Transaction Updated Successfully" });
  } catch (error) {
    console.error("Update Transaction Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getReceiptDetails = async (req, res) => {
  try {
    const user_name = req.user.username;

    // 1. Validate user (Principal equivalent)
    const [user] = await pool.query(
      "SELECT * FROM user WHERE username = ?",
      [user_name]
    );

    if (user.length === 0) {
      return res.status(401).json({ message: "User Not Found" });
    }

    const { owner_id, site_id, room_no } = req.body;

    // 2. Get latest receipt (ORDER BY id DESC LIMIT 1)
    const [rows] = await pool.query(
      `SELECT *
       FROM transaction_tbl
       WHERE site_id = ?
         AND owner_id = ?
         AND room_no = ?
         AND type = 'receipt'
       ORDER BY id DESC
       LIMIT 1`,
      [site_id, owner_id, room_no]
    );

    // If no receipt found
    if (rows.length === 0) {
      return res.status(200).json(null);
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Get Receipt Details Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


exports.getTotalBalanceFromTransaction = async (req, res) => {
  try {
    const user_name = req.user.username;

    // 1. Validate user (Principal equivalent)
    const [user] = await pool.query(
      "SELECT * FROM user WHERE username = ?",
      [user_name]
    );

    if (user.length === 0) {
      return res.status(401).json({ message: "User Not Found" });
    }

    const { owner_id, site_id, room_no } = req.body;

    // 2. Get total receivable (NULL-safe)
    const [[receivableRow]] = await pool.query(
      `SELECT COALESCE(SUM(total_receivable), 0) AS total_receivable
       FROM transaction_tbl
       WHERE site_id = ?
         AND owner_id = ?
         AND room_no = ?`,
      [site_id, owner_id, room_no]
    );

    // 3. Get total received (NULL-safe)
    const [[receivedRow]] = await pool.query(
      `SELECT COALESCE(SUM(total_received), 0) AS total_received
       FROM transaction_tbl
       WHERE site_id = ?
         AND owner_id = ?
         AND room_no = ?`,
      [site_id, owner_id, room_no]
    );

    const total_receivable = receivableRow.total_receivable;
    const total_received = receivedRow.total_received;

    const total_balance = total_receivable - total_received;

    // Debug logs (same as Java)
    console.log("owner_id:", owner_id);
    console.log("site_id:", site_id);
    console.log("total_receivable:", total_receivable);
    console.log("total_received:", total_received);
    console.log("total_balance:", total_balance);

    return res.status(200).json(total_balance);
  } catch (error) {
    console.error("Get Total Balance Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


exports.saveReceipt = async (req, res) => {
  try {
    const user_name = req.user.username;

    // 1. Validate user
    const [user] = await pool.query(
      "SELECT * FROM user WHERE username = ?",
      [user_name]
    );

    if (user.length === 0) {
      return res.status(401).json({ message: "User Not Found" });
    }

    const t = req.body;

    // 2. Safe split main_head_person
    let tenant_name = null;
    let tenant_id = null;

    if (t.main_head_person) {
      const parts = t.main_head_person.split(",");
      tenant_name = parts[0] || null;
      tenant_id = parts[1] ? parseInt(parts[1]) : null;
    }

    // 3. Insert receipt transaction
    await pool.query(
      `INSERT INTO transaction_tbl (
        owner_id,
        site_id,
        room_no,
        tenant_id,
        main_head_person,
        total_received,
        account,
        narration,
        room_rent,
        other_amt,
        total_receivable,
        month,
        year,
        start_date,
        end_date,
        type,
        sys_date
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())`,
      [
        t.owner_id,
        t.site_id,
        t.room_no,
        tenant_id,
        tenant_name,
        t.total_received,
        t.account,
        t.narration || "",
        0,
        0,
        0,
        "",
        "",
        null,
        null,
        "receipt",
      ]
    );

    return res.status(200).json({ message: "Receipt Saved Successfully" });
  } catch (error) {
    console.error("Save Receipt Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};  

exports.updateReceipt = async (req, res) => {
  try {
    const user_name = req.user.username;

    // 1. Validate user
    const [user] = await pool.query(
      "SELECT * FROM user WHERE username = ?",
      [user_name]
    );

    if (user.length === 0) {
      return res.status(401).json({ message: "User Not Found" });
    }

    const t = req.body;

    // 2. Split main_head_person safely
    let tenant_name = null;
    let tenant_id = null;

    if (t.main_head_person) {
      const parts = t.main_head_person.split(",");
      tenant_name = parts[0] || null;
      tenant_id = parts[1] ? parseInt(parts[1]) : null;
    }

    // 3. Get latest receipt
    const [rows] = await pool.query(
      `SELECT *
       FROM transaction_tbl
       WHERE site_id = ?
         AND owner_id = ?
         AND room_no = ?
         AND type = 'receipt'
       ORDER BY id DESC
       LIMIT 1`,
      [t.site_id, t.owner_id, t.room_no]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Receipt Not Found" });
    }

    const receiptId = rows[0].id;

    // 4. Update receipt
    await pool.query(
      `UPDATE transaction_tbl
       SET total_received = ?,
           account = ?,
           narration = ?,
           tenant_id = ?,
           main_head_person = ?,
           sys_date = NOW()
       WHERE id = ?`,
      [
        t.total_received,
        t.account,
        t.narration || "",
        tenant_id,
        tenant_name,
        receiptId,
      ]
    );

    return res.status(200).json({ message: "Receipt Updated Successfully" });
  } catch (error) {
    console.error("Update Receipt Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


exports.getBillingDetailsForReport = async (req, res) => {
  try {
    const user_name = req.user.username;

    // 1. Validate user (Principal equivalent)
    const [user] = await pool.query(
      "SELECT * FROM user WHERE username = ?",
      [user_name]
    );

    if (user.length === 0) {
      return res.status(401).json({ message: "User Not Found" });
    }

    const { owner_id, site_id } = req.body;

    // 2. Fetch raw billing data
    const [rows] = await pool.query(
      `SELECT 
         t.room_no,
         t.total_receivable,
         t.main_head_person,
         t.sys_date,
         tr.mobile_no
       FROM transaction_tbl t
       JOIN tenant tr ON t.tenant_id = tr.id
       WHERE t.site_id = ?
         AND t.owner_id = ?
         AND t.type = 'rent'`,
      [site_id, owner_id]
    );

    // 3. Map to DTO-style response
    const result = rows.map(row => ({
      room_no: row.room_no,
      total_receivable: row.total_receivable,
      main_head_person: row.main_head_person,
      sys_date: row.sys_date,      // already Date/DateTime from MySQL
      phone_no: row.mobile_no,
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.error("Billing Report Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getReceiptDetailsForReport = async (req, res) => {
  try {
    const user_name = req.user.username;

    // 1. Validate user
    const [user] = await pool.query(
      "SELECT * FROM user WHERE username = ?",
      [user_name]
    );

    if (user.length === 0) {
      return res.status(401).json({ message: "User Not Found" });
    }

    const { owner_id, site_id, room_no } = req.body;

    // 2. Fetch receipt details for report
    const [receipts] = await pool.query(
      `SELECT *
       FROM transaction_tbl
       WHERE site_id = ?
         AND owner_id = ?
         AND room_no = ?
         AND type = 'receipt'
       ORDER BY id DESC`,
      [site_id, owner_id, room_no]
    );

    return res.status(200).json(receipts);
  } catch (error) {
    console.error("Receipt Report Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};