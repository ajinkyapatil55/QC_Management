const authService = require("../services/authService");
const db = require("../config/db");

exports.authenticate = async (req, res) => {
  try {
    const result = await authService.authenticate(req.body);
    res.json(result);
  } catch (e) {
    res.status(401).json({ message: e.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const msg = await authService.changePassword(
      req.user.username,
      req.body
    );
    res.status(200).json({ message: msg });
  } catch (e) {
    const status = e.status || 500;
    res.status(status).json({ message: e.message });
  }
};


exports.saveToken = async (req, res) => {
  try {
    const username = req.user.username;
    const { fcmToken, deviceId = 'unknown', deviceName } = req.body;

    console.log('✅ Token Save');
    console.log('username:', username);
    console.log('fcmToken:', fcmToken);
    console.log('deviceId:', deviceId);
    console.log('deviceName:', deviceName);

    const now = new Date();

    // 1️⃣ Check existing token
    const [rows] = await db.query(
      'SELECT id FROM users_fcm_tokens WHERE fcm_token = ?',
      [fcmToken]
    );

    if (rows.length > 0) {
      // UPDATE
      await db.query(
        `UPDATE users_fcm_tokens 
         SET username=?, device_id=?, device_name=?, updated_at=? 
         WHERE fcm_token=?`,
        [username, deviceId, deviceName, now, fcmToken]
      );
    } else {
      // INSERT
      await db.query(
        `INSERT INTO users_fcm_tokens 
         (username, fcm_token, device_id, device_name, created_at, updated_at)
         VALUES (?,?,?,?,?,?)`,
        [username, fcmToken, deviceId, deviceName, now, now]
      );
    }

    return res.status(200).json({ message: 'saved' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};



// authController.js
exports.getCurrentUser = async (req, res) => {
  try {
    console.log(req.user.username)
    if (!req.user || !req.user.username) {
      return res.status(401).json({ message: "Unauthorized: No user info found" });
    }

    const username = req.user.username;

    // Query database safely
    const [rows] = await db.query("SELECT * FROM user WHERE username = ?", [username]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];

    res.status(200).json({
      id: user.id,
      username: user.username,
      role: user.role
    });
  } catch (err) {
    console.error("Error in getCurrentUser:", err);
    res.status(500).json({ message: "Server error" });
  }
};



