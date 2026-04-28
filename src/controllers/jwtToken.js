/* =========================
   SAVE TOKEN IN SESSION
========================= */
exports.saveToken = (req, res) => {
  try {
    const { token } = req.body;
    req.session.token = token;
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

/* =========================
   GET TOKEN FROM SESSION
========================= */
exports.getToken = (req, res) => {
  try {
    res.send(req.session.token || null);
  } catch (err) {
    res.send(null);
  }
};
