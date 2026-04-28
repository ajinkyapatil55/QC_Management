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
   GET ALL ASC
========================= */
exports.getAllAsc = async (req, res) => {
  const user = await checkUser(req.user.username);
  if (!user) return res.status(401).send("User Not Found");

  const { owner_id } = req.body;
  const [rows] = await pool.query(
    "SELECT * FROM room_allocation WHERE owner_id=? ORDER BY id ASC",
    [owner_id]
  );
  res.json(rows);
};

/* =========================
   GET ALL DESC
========================= */
exports.getAllDesc = async (req, res) => {
  const user = await checkUser(req.user.username);
  if (!user) return res.status(401).send("User Not Found");

  const { owner_id } = req.body;
  const [rows] = await pool.query(
    "SELECT * FROM room_allocation WHERE owner_id=? ORDER BY id DESC",
    [owner_id]
  );
  res.json(rows);
};

/* =========================
   BY SITE
========================= */
exports.getBySite = async (req, res) => {
  const user = await checkUser(req.user.username);
  if (!user) return res.status(401).send("User Not Found");

  const { site_id, owner_id } = req.body;
  const [rows] = await pool.query(
    "SELECT * FROM room_allocation WHERE site_id=? AND owner_id=? ORDER BY id DESC",
    [site_id, owner_id]
  );
  res.json(rows);
};

/* =========================
   BY OWNER
========================= */
exports.getByOwner = async (req, res) => {
  const user = await checkUser(req.user.username);
  if (!user) return res.status(401).send("User Not Found");

  const { owner_id } = req.body;
  const [rows] = await pool.query(
    "SELECT * FROM room_allocation WHERE owner_id=? ORDER BY id DESC",
    [owner_id]
  );
  res.json(rows);
};

/* =========================
   BY SITE & FLOOR
========================= */
exports.getBySiteFloor = async (req, res) => {
  const user = await checkUser(req.user.username);
  if (!user) return res.status(401).send("User Not Found");

  const { owner_id, floor } = req.body;
  const [rows] = await pool.query(
    "SELECT * FROM room_allocation WHERE owner_id=? AND floor=? ORDER BY id DESC",
    [owner_id, floor]
  );
  res.json(rows);
};

/* =========================
   GET BY ID
========================= */
exports.getById = async (req, res) => {
  const user = await checkUser(req.user.username);
  if (!user) return res.status(401).send("User Not Found");

  const { roomallocation_id, owner_id } = req.body;
  const [[row]] = await pool.query(
    "SELECT * FROM room_allocation WHERE id=? AND owner_id=?",
    [roomallocation_id, owner_id]
  );
  res.json(row || null);
};

/* =========================
   SAVE ROOM ALLOCATION
========================= */
exports.saveRoomAllocation = async (req, res) => {
  console.log("API Call");

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const {
      room_id,
      tenant_id,
      room_no,
      owner_id,
      site_id,
      main_person_status,
      main_person,
      allocate_date,
    } = req.body;



    const allocDate = new Date(allocate_date)
      .toISOString()
      .substring(0, 10);

    console.log("allocDate:", allocDate);

    /* =======================
       Update tenant
       ======================= */
    await conn.query(
      `UPDATE tenant
       SET status='YES',
           room_id=?,
           room_no=?
       WHERE owner_id=? AND id=?`,
      [room_id, room_no, owner_id, tenant_id]
    );

    /* =======================
       Get room
       ======================= */
    const [[room]] = await conn.query(
      `SELECT allocate_tenant, main_head_person, floor
       FROM room
       WHERE id=? AND owner_id=?`,
      [room_id, owner_id]
    );

    const allocateTenant = (room.allocate_tenant || 0) + 1;

    let mainHeadPerson = room.main_head_person || "";

    if (main_person_status === "YES") {
      mainHeadPerson = mainHeadPerson
        ? `${mainHeadPerson},${tenant_id}`
        : `${tenant_id}`;
    }

    /* =======================
       Update room
       ======================= */
    await conn.query(
      `UPDATE room
       SET allocate_tenant=?,
           main_head_person=?
       WHERE id=? AND owner_id=?`,
      [allocateTenant, mainHeadPerson, room_id, owner_id]
    );

    /* =======================
       Insert allocation
       ======================= */
    await conn.query(
      `INSERT INTO room_allocation
       (site_id, floor, owner_id, tenant_id, room_id,room_no, status, allocate_date, sys_date)
       VALUES (?,?,?,?,?,?,?,?,NOW())`,
      [
        site_id,
        room.floor,
        owner_id,
        tenant_id,
        room_id,
        room_no,
        "active",
        allocDate,
      ]
    );

    await conn.commit();
    res.sendStatus(200);

  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).send("Room allocation failed");
  } finally {
    conn.release();
  }
};

/* =========================
   ACTIVE TENANTS IN ROOM
========================= */
exports.getRoomActive = async (req, res) => {
  const user = await checkUser(req.user.username);
  if (!user) return res.status(401).send("User Not Found");

  const { room_id, owner_id } = req.body;

  const [rows] = await pool.query(
    `SELECT ra.id,t.tenant_full_name,t.id tid,t.mobile_no
     FROM room_allocation ra
     JOIN tenant t ON ra.tenant_id=t.id
     WHERE ra.room_id=? AND ra.owner_id=? AND ra.status='active' AND t.status='YES'`,
    [room_id, owner_id]
  );

  res.json(
    rows.map((r) => ({
      id: r.id,
      name: r.tenant_full_name,
      tid: r.tid,
      contact: r.mobile_no,
    }))
  );
};

/* =========================
   ROOM ALLOCATION RECORD
========================= */
exports.roomAllocationRecord = async (req, res) => {
  const user = await checkUser(req.user.username);
  if (!user) return res.status(401).send("User Not Found");

  const { owner_id } = req.body;

  const [rows] = await pool.query(
    `SELECT t.tenant_full_name,s.sitename,r.room_no,ra.allocate_date
     FROM room_allocation ra
     JOIN tenant t ON ra.tenant_id=t.id
     JOIN site s ON ra.site_id=s.id
     JOIN room r ON ra.room_id=r.id
     WHERE ra.owner_id=?
     ORDER BY ra.id DESC`,
    [owner_id]
  );

  res.json(
    rows.map((r) => ({
      name: r.tenant_full_name,
      sitename: r.sitename,
      room_no: r.room_no,
      date: r.allocate_date,
    }))
  );
};

/* =========================
   SAVE ROOM LEAVING
========================= */
exports.saveRoomLeaving = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const {
      room_id,
      tenant_id,
      room_no,
      owner_id,
      site_id,
      note,
      leaving_date,
    } = req.body;

    const leaveDate = leaving_date.substring(0, 10);

    /* Update tenant */
    await conn.query(
      `UPDATE tenant
       SET status='NO', leaving_date=?, note=?
       WHERE owner_id=? AND id=?`,
      [leaveDate, note, owner_id, tenant_id]
    );

    /* Update room */
    const [[room]] = await conn.query(
      "SELECT * FROM room WHERE id=? AND owner_id=?",
      [room_id, owner_id]
    );

    const allocateTenant = room.allocate_tenant - 1;

    const [[nextTenant]] = await conn.query(
      `SELECT * FROM tenant
       WHERE site_id=? AND room_no=? AND room_id=? AND owner_id=? AND status='YES'
       ORDER BY id DESC LIMIT 1`,
      [site_id, room_no, room_id, owner_id]
    );

    const mainHead = nextTenant
      ? `${nextTenant.tenant_full_name},${nextTenant.id}`
      : "";

    await conn.query(
      `UPDATE room
       SET allocate_tenant=?, main_head_person=?
       WHERE id=? AND owner_id=?`,
      [allocateTenant, mainHead, room_id, owner_id]
    );

    /* Deactivate allocation */
    await conn.query(
      `UPDATE room_allocation
       SET status='deactive', leaving_date=?
       WHERE owner_id=? AND tenant_id=? AND room_id=? AND room_no=? AND site_id=?`,
      [leaveDate, owner_id, tenant_id, room_id, room_no, site_id]
    );

    await conn.commit();
    res.sendStatus(200);
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.sendStatus(500);
  } finally {
    conn.release();
  }
};

exports.getRoomDetails = async (req, res) => {
  try {
    const {
      owner_id,
      site_id,
      tenant_id,
      room_no,
      room_id,
    } = req.body;
console.log("owner_id:"+ owner_id)
console.log("site_id:"+ site_id)
console.log("tenant_id:"+ tenant_id)
console.log("room_no:"+ room_no)
console.log("room_id:"+ room_id)

    const [[room]] = await pool.query(
      `SELECT *
       FROM room_allocation
       WHERE owner_id = ?
         AND site_id = ?
         AND tenant_id = ?
         AND room_no = ?
         AND room_id = ?
         AND status = 'active'`,
      [owner_id, site_id, tenant_id, room_no, room_id]
    );

    // Same behavior as JPA: return object or null
    return res.status(200).json(room || null);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

