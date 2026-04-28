const jwt = require("jsonwebtoken");
const jwtConfig = require("../config/jwt");

module.exports = function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    req.user = jwt.verify(token, jwtConfig.secret);
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
