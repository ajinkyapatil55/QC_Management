const pool = require("../config/db");
const bcrypt = require("bcryptjs");

/* =========================
   GET ALL OWNERS ASC
========================= */
exports.getAllOwnersAsc = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM owner ORDER BY id ASC"
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

/* =========================
   GET ALL OWNERS DESC
========================= */
exports.getAllOwnersDesc = async (req, res) => {
  console.log(JSON.stringify("Aabed"))
  try {
    const [rows] = await pool.query(
      "SELECT * FROM owner ORDER BY id DESC"
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

/* =========================
   GET OWNER BY ID
========================= */
exports.getOwnerById = async (req, res) => {
  try {
    const { owner_id } = req.body;
    const [rows] = await pool.query(
      "SELECT * FROM owner WHERE id=?",
      [owner_id]
    );
    res.status(200).json(rows[0] || null);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

/* =========================
   SAVE OWNER
========================= */
exports.saveOwner = async (req, res) => {
  try {
    const {
      owner_name,
      age,
      contact1,
      contact2,
      email,
      address,
    } = req.body;

    const mobileRegex = /^[6-9]\d{9}$/;

    if (!mobileRegex.test(contact1)) {
      return res.status(400).send("Invalid Mobile No1.");
    }
    if (contact2 && !mobileRegex.test(contact2)) {
      return res.status(400).send("Invalid Mobile No2.");
    }

    // insert owner
    const [result] = await pool.query(
      `INSERT INTO owner (owner_name, age, contact1, contact2, email_id, address)
       VALUES (?,?,?,?,?,?)`,
      [owner_name, age || 0, contact1, contact2, email, address]
    );

    const ownerId = result.insertId;

    // create user
    const hashedPassword = await bcrypt.hash(contact1, 10);

    await pool.query(
      `INSERT INTO user (contact_no1, contact_no2, email_id, username, password,owner_id,password_text)
       VALUES (?,?,?,?,?,?,?)`,
      [contact1, contact2, email, email, hashedPassword,ownerId,contact1]
    );

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

/* =========================
   UPDATE OWNER
========================= */
exports.updateOwner = async (req, res) => {
  try {
    const {
      owner_id,
      owner_name,
      age,
      contact1,
      contact2,
      email,
      address,
    } = req.body;

    

    const mobileRegex = /^[6-9]\d{9}$/;
    const emailRegex = /^[A-Za-z0-9+_.-]+@(.+)$/;

    if (!mobileRegex.test(contact1)) {
      return res.status(400).send("Invalid Mobile No1.");
    }
    if (contact2 && !mobileRegex.test(contact2)) {
      return res.status(400).send("Invalid Mobile No2.");
    }
    if (!emailRegex.test(email)) {
      return res.status(400).send("Invalid Email Id.");
    }

    await pool.query(
      `UPDATE owner SET owner_name=?, age=?, contact1=?, contact2=?, email_id=?, address=?
       WHERE id=?`,
      [owner_name, age, contact1, contact2, email, address, owner_id]
    );


    const hashedPassword = await bcrypt.hash(contact1, 10);

    await pool.query(
      `UPDATE user SET contact_no1=?, contact_no2=?, email_id=?, username=?, password=?
       WHERE owner_id=?`,
      [contact1, contact2, email, email, hashedPassword, owner_id]
    );

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

/* =========================
   OWNER + TENANT PRINT DATA
========================= */
exports.getOwnerTenantDetails = async (req, res) => {
  try {
    const { owner_id, site_id } = req.body;

    const [[site]] = await pool.query(
      "SELECT * FROM site WHERE id=? AND owner_id=?",
      [site_id, owner_id]
    );

    if (!site) return res.status(404).json([]);

    const [tenants] = await pool.query(
      `SELECT * FROM tenant 
       WHERE site_id=? AND status='YES'
       ORDER BY room_no ASC`,
      [site.id]
    );

    res.status(200).json([
      {
        site,
        tenants,
      },
    ]);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};
