const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const jwtConfig = require("../config/jwt");

/* ================= AUTHENTICATE ================= */
exports.authenticate = async ({ username, password }) => {

  // user table (reserved keyword → backticks)
  const [users] = await pool.query(
    "SELECT * FROM `user` WHERE username = ?",
    [username]
  );

  if (!users.length) throw new Error("INVALID_CREDENTIALS");

  const user = users[0];

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw new Error("INVALID_CREDENTIALS");

  /* ===== ROLES (like JWTUserDetailsService) ===== */
  const [roles] = await pool.query(
    `
    SELECT r.role_name
    FROM user_roles ur
    JOIN role r ON r.id = ur.role_id
    WHERE ur.user_id = ?
    `,
    [user.user_id]
  );

  // use role directly from user table if it exists
  let role = user.role || "ROLE_USER";

  /* ===== OWNER ID (UserOwnerService) ===== */
  let owner_id = 0;
  if (role === "ROLE_ADMIN") {
    const [o] = await pool.query(
      `
      SELECT o.owner_id
      FROM user_owner o
      JOIN user u ON u.user_id = o.user_id
      WHERE u.username = ?
      `,
      [username]
    );
    if (o.length) owner_id = o[0].owner_id;
  }

  /* ===== JWT TOKEN ===== */
  const token = jwt.sign(
    {
      user_id: user.user_id,
      client_id: user.client_id,
      username: user.username,
      role: user.role,
      owner_id,
      company: user.clientName,
    },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn }
  );

  return { token, role, owner_id };
};



/* ================= CHANGE PASSWORD ================= */
exports.changePassword = async (username, dto) => {
  console.log("Change Pass");

  const { old_password, new_password, confirm_password } = dto;

  if (!old_password)
    throw new ApiError(400, "Old Password Should Not Empty");

  if (!new_password || new_password.length <= 5)
    throw new ApiError(400, "Password Should Be Atleast Six Digit");

  if (!confirm_password || confirm_password.length <= 5)
    throw new ApiError(400, "Confirm Password Should Be Atleast Six Digit");

  if (new_password !== confirm_password)
    throw new ApiError(400, "New Password & Confirm Password Should Same");

  const [rows] = await pool.query(
    "SELECT * FROM `user` WHERE username = ?",
    [username]
  );

  if (!rows.length)
    throw new ApiError(404, "User Not Exists");

  const user = rows[0];

  const match = await bcrypt.compare(old_password, user.password);
  if (!match)
    throw new ApiError(400, "Old Password Not Matched");

  const encrypted = await bcrypt.hash(new_password, 10);

  await pool.query(
    "UPDATE `user` SET password = ? WHERE user_id = ?",
    [encrypted, user.user_id]
  );

  return "Password Changed Successfully";
};