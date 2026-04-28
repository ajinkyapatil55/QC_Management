const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const auth = require("../middleware/authMiddleware");

router.post("/authenticate", authController.authenticate);

router.post("/rest_api_change_user_password", auth, authController.changePassword);

router.post("/rest_api_register", auth, authController.saveToken);

router.post("/rest_api_get_role", auth, authController.getCurrentUser);



module.exports = router;
