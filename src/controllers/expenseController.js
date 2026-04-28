const pool = require("../config/db");

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
   GET ALL EXPENSES (SITE + OWNER)
========================= */
exports.getAllExpenses = async (req, res) => {
  try {
    const user = await checkUser(req.user.username);
    if (!user) return res.status(401).send("User Not Found");

    const { owner_id, site_id } = req.body;

    const [rows] = await pool.query(
      "SELECT * FROM expense WHERE site_id=? AND owner_id=? ORDER BY id DESC",
      [site_id, owner_id]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

/* =========================
   EXPENSE REPORT (BETWEEN DATES)
========================= */
exports.getExpenseReport = async (req, res) => {
  try {
    const user = await checkUser(req.user.username);
    if (!user) return res.status(401).send("User Not Found");

    const { owner_id, site_id, start, end } = req.body;

    let rows;
    if (start && end) {
      [rows] = await pool.query(
        `SELECT * FROM expense
         WHERE sys_date BETWEEN ? AND ?
         AND site_id=? AND owner_id=?
         ORDER BY id DESC`,
        [start, end, site_id, owner_id]
      );
    } else {
      [rows] = await pool.query(
        "SELECT * FROM expense WHERE site_id=? AND owner_id=? ORDER BY id DESC",
        [site_id, owner_id]
      );
    }

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

/* =========================
   GET EXPENSE BY ID
========================= */
exports.getExpenseById = async (req, res) => {
  try {
    const user = await checkUser(req.user.username);
    if (!user) return res.status(401).send("User Not Found");

    const { id, site_id, owner_id } = req.body;

    const [[expense]] = await pool.query(
      "SELECT * FROM expense WHERE id=? AND site_id=? AND owner_id=?",
      [id, site_id, owner_id]
    );

    res.json(expense || null);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

/* =========================
   SAVE EXPENSE
========================= */
exports.saveExpense = async (req, res) => {
  try {
    const user = await checkUser(req.user.username);
    if (!user) return res.status(401).send("User Not Found");

    const {
      amount,
      narration,
      site_id,
      site_name,
      owner_id
    } = req.body;

    await pool.query(
      `INSERT INTO expense
       (amount,narration,site_id,site_name,owner_id,sys_date)
       VALUES (?,?,?,?,?,NOW())`,
      [amount, narration, site_id, site_name, owner_id]
    );

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

/* =========================
   UPDATE EXPENSE
========================= */
exports.updateExpense = async (req, res) => {
  try {
    const user = await checkUser(req.user.username);
    if (!user) return res.status(401).send("User Not Found");

    const {
      id,
      site_id,
      owner_id,
      amount,
      narration,
      site_name
    } = req.body;

    const [[existing]] = await pool.query(
      "SELECT * FROM expense WHERE id=? AND site_id=? AND owner_id=?",
      [id, site_id, owner_id]
    );

    if (!existing) {
      return res.status(404).send("Expense Not Found");
    }

    await pool.query(
      `UPDATE expense
       SET amount=?, narration=?, site_id=?, site_name=?, owner_id=?, sys_date=NOW()
       WHERE id=? AND site_id=? AND owner_id=?`,
      [amount, narration, site_id, site_name, owner_id, id, site_id, owner_id]
    );

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

/* =========================
   DELETE EXPENSE
========================= */
exports.deleteExpense = async (req, res) => {
  try {
    const user = await checkUser(req.user.username);
    if (!user) return res.status(401).send("User Not Found");

    const { id, site_id, owner_id } = req.body;

    const [[existing]] = await pool.query(
      "SELECT * FROM expense WHERE id=? AND site_id=? AND owner_id=?",
      [id, site_id, owner_id]
    );

    if (!existing) {
      return res.status(404).send("Expense Not Found");
    }

    await pool.query(
      "DELETE FROM expense WHERE id=? AND site_id=? AND owner_id=?",
      [id, site_id, owner_id]
    );

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};
