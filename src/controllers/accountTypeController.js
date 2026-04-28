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
   GET ALL ACCOUNT TYPE LIST
   (Spring: /api_get_all_account_type_list)
========================= */
exports.getAllAccountTypeList = async (req, res) => {
  try {
    const user = await checkUser(req.user.username);
    if (!user) return res.status(401).send("User Not Found");

    const [rows] = await pool.query(
      "SELECT * FROM account_type ORDER BY id DESC"
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};
