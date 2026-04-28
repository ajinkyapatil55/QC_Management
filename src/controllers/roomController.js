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
   GET ALL ROOMS ASC
========================= */
exports.getRoomsAsc = async (req, res) => {
  const user = await checkUser(req.user.username);
  if (!user) return res.status(401).send("User Not Found");

  const { owner_id } = req.body;
  const [rows] = await pool.query(
    "SELECT * FROM room WHERE owner_id=? ORDER BY id DESC",
    [owner_id]
  );
  res.json(rows);
};

/* =========================
   GET ALL ROOMS DESC
========================= */
exports.getRoomsDesc = async (req, res) => {
  const user = await checkUser(req.user.username);
  if (!user) return res.status(401).send("User Not Found");

  const { owner_id } = req.body;
  const [rows] = await pool.query(
    "SELECT * FROM room WHERE owner_id=? ORDER BY id DESC",
    [owner_id]
  );
  res.json(rows);
};

/* =========================
   GET ROOMS BY SITE
========================= */
exports.getRoomsBySite = async (req, res) => {
  const user = await checkUser(req.user.username);
  if (!user) return res.status(401).send("User Not Found");

  const { site_id, owner_id } = req.body;
  const [rows] = await pool.query(
    "SELECT * FROM room WHERE site_id=? AND owner_id=? ORDER BY room_no ASC",
    [site_id, owner_id]
  );
  res.json(rows);
};

/* =========================
   GET ROOMS BY SITE & FLOOR
========================= */
exports.getRoomsBySiteFloor = async (req, res) => {
  const user = await checkUser(req.user.username);
  if (!user) return res.status(401).send("User Not Found");

  const { site_id, owner_id, floor } = req.body;
  const [rows] = await pool.query(
    "SELECT * FROM room WHERE site_id=? AND floor=? AND owner_id=?",
    [site_id, floor, owner_id]
  );
  res.json(rows);
};

/* =========================
   GET ROOM BY ID
========================= */
exports.getRoomById = async (req, res) => {
  const user = await checkUser(req.user.username);
  if (!user) return res.status(401).send("User Not Found");

  const { room_id, owner_id } = req.body;
  const [[room]] = await pool.query(
    "SELECT * FROM room WHERE id=? AND owner_id=?",
    [room_id, owner_id]
  );
  res.json(room || null);
};

/* =========================
   SAVE ROOMS (BULK)
========================= */
exports.saveRooms = async (req, res) => {
  try {
    const { site_id, owner_id, floor, data } = req.body;

    for (const r of data) {
      await pool.query(
        `INSERT INTO room
         (site_id, owner_id, floor, room_no, capacity,
          room_type, room_size, room_rent,
          allocate_tenant,main_head_status)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [
          site_id,
          owner_id,
          floor,
          r.room_no,
          r.capacity,
          r.room_type,
          r.room_size || "0",
          r.room_rent,
          0,
          "NO"
        ]
      );
    }

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

/* =========================
   UPDATE ROOM
========================= */
exports.updateRoom = async (req, res) => {
  const user = await checkUser(req.user.username);
  if (!user) return res.status(401).send("User Not Found");

  const { room_id, owner_id, site_id, room_no, floor } = req.body;

  await pool.query(
    `UPDATE room SET site_id=?, room_no=?, floor=?
     WHERE id=? AND owner_id=?`,
    [site_id, room_no, floor, room_id, owner_id]
  );

  res.sendStatus(200);
};

/* =========================
   COUNT TOTAL ROOMS
========================= */
exports.countTotalRooms = async (req, res) => {
  const user = await checkUser(req.user.username);
  if (!user) return res.status(401).send("User Not Found");

  const { owner_id } = req.body;
  const [[r]] = await pool.query(
    "SELECT COUNT(*) AS count FROM room WHERE owner_id=?",
    [owner_id]
  );

  res.json({ count: r.count });
};

/* =========================
   COUNT ROOMS BY STATUS
========================= */
exports.countRoomsByStatus = async (req, res) => {
  const user = await checkUser(req.user.username);
  if (!user) return res.status(401).send("User Not Found");

  const { empty_status, partial_status, full_status, owner_id } = req.body;

  const [[r]] = await pool.query(
    `SELECT COUNT(*) AS count FROM room
     WHERE empty_status=? AND partial_status=? AND full_status=?
     AND owner_id=?`,
    [empty_status, partial_status, full_status, owner_id]
  );

  res.json({ count: r.count });
};

/* =========================
   COUNT ROOMS BY FLOOR
========================= */
exports.countRoomsByFloor = async (req, res) => {
  const user = await checkUser(req.user.username);
  if (!user) return res.status(401).send("User Not Found");

  const { site_id, owner_id } = req.body;

  const [rows] = await pool.query(
    `SELECT floor, COUNT(*) AS count
     FROM room WHERE site_id=? AND owner_id=?
     GROUP BY floor`,
    [site_id, owner_id]
  );

  res.json(rows);
};

/* =========================
   GET ROOMS BY OWNER & SITE
========================= */
exports.getRoomsByOwnerAndSite = async (req, res) => {
  const user = await checkUser(req.user.username);
  if (!user) return res.status(401).send("User Not Found");

  const { owner_id, site_id } = req.body;

  const [rows] = await pool.query(
    "SELECT * FROM room WHERE site_id=? AND owner_id=? ORDER BY room_no ASC",
    [site_id, owner_id]
  );

  res.json(rows);
};

/* =========================
   GET MAIN PERSON STATUS
========================= */
exports.getMainPersonStatus = async (req, res) => {
  const user = await checkUser(req.user.username);
  if (!user) return res.status(401).send("User Not Found");

  const { site_id, owner_id, room_no, floor } = req.body;
  const [[r]] = await pool.query(
    `SELECT main_head_status FROM room
     WHERE site_id=? AND owner_id=? AND room_no=? AND floor=?`,
    [site_id, owner_id, room_no, floor]
  );

  res.json(r?.main_head_status || "NO");
};

/* =========================
   AVAILABLE ROOMS
========================= */
exports.getAvailableRooms = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT r.*, s.sitename
     FROM room r
     JOIN site s ON r.site_id=s.id
     WHERE r.allocate_tenant=0
     ORDER BY r.id DESC`
  );

  res.json(rows);
};
