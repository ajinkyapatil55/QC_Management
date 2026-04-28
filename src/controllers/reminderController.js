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
   GET ALL REMINDERS
========================= */
exports.getAllReminders = async (req, res) => {
  try {
    const user = await checkUser(req.user.username);
    if (!user) return res.status(401).send("User Not Found");

    const { owner_id } = req.body;

    const [rows] = await pool.query(
      "SELECT * FROM reminder WHERE owner_id=? ORDER BY id DESC",
      [owner_id]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

/* =========================
   GET REMINDER BY ID
========================= */
exports.getReminderById = async (req, res) => {
  try {
    const user = await checkUser(req.user.username);
    if (!user) return res.status(401).send("User Not Found");

    const { id, owner_id } = req.body;

    const [[reminder]] = await pool.query(
      "SELECT * FROM reminder WHERE id=? AND owner_id=?",
      [id, owner_id]
    );

    res.json(reminder || null);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

/* =========================
   SAVE REMINDER
========================= */
exports.saveReminder = async (req, res) => {
  try {
    const user = await checkUser(req.user.username);
    if (!user) return res.status(401).send("User Not Found");

    const { title, date, time, status, owner_id } = req.body;

    await pool.query(
      `INSERT INTO reminder (title,date,time,status,owner_id)
       VALUES (?,?,?,?,?)`,
      [title, date, time, status, owner_id]
    );

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

/* =========================
   UPDATE REMINDER
========================= */
exports.updateReminder = async (req, res) => {
  try {
    const user = await checkUser(req.user.username);
    if (!user) return res.status(401).send("User Not Found");

    const { id, owner_id, title, date, time, status } = req.body;

    const [[existing]] = await pool.query(
      "SELECT * FROM reminder WHERE id=? AND owner_id=?",
      [id, owner_id]
    );

    if (!existing) {
      return res.status(404).send("Reminder Not Found");
    }

    await pool.query(
      `UPDATE reminder
       SET title=?, date=?, time=?, status=?
       WHERE id=? AND owner_id=?`,
      [title, date, time, status, id, owner_id]
    );

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

/* =========================
   DELETE REMINDER
========================= */
exports.deleteReminder = async (req, res) => {
  try {
    const user = await checkUser(req.user.username);
    if (!user) return res.status(401).send("User Not Found");

    const { id, owner_id } = req.body;

    const [[existing]] = await pool.query(
      "SELECT * FROM reminder WHERE id=? AND owner_id=?",
      [id, owner_id]
    );

    if (!existing) {
      return res.status(404).send("Reminder Not Found");
    }

    await pool.query(
      "DELETE FROM reminder WHERE id=? AND owner_id=?",
      [id, owner_id]
    );

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

/* =========================
   GET ACTIVE REMINDERS
========================= */
exports.getActiveReminders = async (req, res) => {
  try {
    const user = await checkUser(req.user.username);
    if (!user) return res.status(401).send("User Not Found");

    const { owner_id } = req.body;

    const [rows] = await pool.query(
      "SELECT * FROM reminder WHERE owner_id=? AND status='active' ORDER BY id DESC",
      [owner_id]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

