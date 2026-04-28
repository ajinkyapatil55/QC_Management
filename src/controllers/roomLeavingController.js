const pool = require("../config/db");

/* =========================
   AUTH HELPER
========================= */
const checkUser = async (username) => {
  const [[user]] = await pool.query(
    "SELECT * FROM user WHERE username=?",
    [username]
  );
  return user;
};

/* =========================
   GET ALL ROOM LEAVINGS ASC
========================= */
exports.getAllAsc = async (req, res) => {
  const user = await checkUser(req.user.username);
  if (!user) return res.status(401).send("User Not Found");

  const { owner_id } = req.body;

  const [rows] = await pool.query(
    "SELECT * FROM room_leaving WHERE owner_id=? ORDER BY id ASC",
    [owner_id]
  );

  res.json(rows);
};

/* =========================
   GET ALL ROOM LEAVINGS DESC
========================= */
exports.getAllDesc = async (req, res) => {
  const user = await checkUser(req.user.username);
  if (!user) return res.status(401).send("User Not Found");

  const { owner_id } = req.body;

  const [rows] = await pool.query(
    "SELECT * FROM room_leaving WHERE owner_id=? ORDER BY id DESC",
    [owner_id]
  );

  res.json(rows);
};

/* =========================
   GET ROOM LEAVINGS BY SITE
========================= */
exports.getBySite = async (req, res) => {
  const user = await checkUser(req.user.username);
  if (!user) return res.status(401).send("User Not Found");

  const { site_id, owner_id } = req.body;

  const [rows] = await pool.query(
    "SELECT * FROM room_leaving WHERE site_id=? AND owner_id=? ORDER BY id DESC",
    [site_id, owner_id]
  );

  res.json(rows);
};

/* =========================
   GET ROOM LEAVINGS BY OWNER
========================= */
exports.getByOwner = async (req, res) => {
  const user = await checkUser(req.user.username);
  if (!user) return res.status(401).send("User Not Found");

  const { owner_id } = req.body;

  const [rows] = await pool.query(
    "SELECT * FROM room_leaving WHERE owner_id=? ORDER BY id DESC",
    [owner_id]
  );

  res.json(rows);
};

/* =========================
   GET ROOM LEAVINGS BY SITE & FLOOR
========================= */
exports.getBySiteFloor = async (req, res) => {
  const user = await checkUser(req.user.username);
  if (!user) return res.status(401).send("User Not Found");

  const { site_id, owner_id, floor } = req.body;

  const [rows] = await pool.query(
    "SELECT * FROM room_leaving WHERE site_id=? AND floor=? AND owner_id=? ORDER BY id DESC",
    [site_id, floor, owner_id]
  );

  res.json(rows);
};

/* =========================
   GET ROOM LEAVING BY ID
========================= */
exports.getById = async (req, res) => {
  const user = await checkUser(req.user.username);
  if (!user) return res.status(401).send("User Not Found");

  const { roomleaving_id } = req.body;

  const [[row]] = await pool.query(
    "SELECT * FROM room_leaving WHERE id=?",
    [roomleaving_id]
  );

  res.json(row || null);
};

/* =========================
   UPDATE ROOM LEAVING
========================= */
exports.updateRoomLeaving = async (req, res) => {
  const user = await checkUser(req.user.username);
  if (!user) return res.status(401).send("User Not Found");

  try {
    const {
      roomleaving_id,
      room_id,
      site_id,
      owner_id,
      tenant_id,
      floor,
    } = req.body;

    await pool.query(
      `UPDATE room_leaving SET
        room_id=?, site_id=?, owner_id=?, tenant_id=?, floor=?
       WHERE id=?`,
      [
        room_id,
        site_id,
        owner_id,
        tenant_id,
        floor,
        roomleaving_id,
      ]
    );

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

/* =========================
   ROOM LEAVING RECORD (REPORT)
========================= */
exports.roomLeavingRecord = async (req, res) => {
  const user = await checkUser(req.user.username);
  if (!user) return res.status(401).send("User Not Found");

  const { owner_id } = req.body;

  try {
    const [rows] = await pool.query(
      `SELECT t.tenant_full_name, s.sitename, r.room_no, rl.allocate_date
       FROM room_leaving rl
       JOIN tenant t ON rl.tenant_id=t.id
       JOIN site s ON rl.site_id=s.id
       JOIN room r ON rl.room_id=r.id
       WHERE rl.owner_id=?
       ORDER BY rl.id DESC`,
      [owner_id]
    );

    const result = rows.map((r) => ({
      name: r.tenant_full_name,
      sitename: r.sitename,
      room_no: r.room_no,
      date: r.allocate_date,
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};
