module.exports = {
  secret: process.env.JWT_SECRET,   // javainuse / intelligic
  expiresIn: "5h",                  // same as Spring (5 * 60 * 60)
};
