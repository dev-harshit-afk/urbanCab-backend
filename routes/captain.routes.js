const express = require("express");
const {
  registerCaptain,
  loginCaptain,
  getCaptainProfile,
  logoutCaptain,
  getCaptainStats,
} = require("../controllers/captain.controller");
const { body } = require("express-validator");
const {
  captainRegisterValidator,
  validatorHandler,
  LoginValidator,
} = require("../lib/validators");
const { authCaptain } = require("../middlewares/auth.middleware");
const router = express.Router();

router.post(
  "/register",
  captainRegisterValidator(),
  validatorHandler,
  registerCaptain
);

router.post("/login", LoginValidator(), validatorHandler, loginCaptain);

router.use(authCaptain);
router.get("/profile", getCaptainProfile);
router.get("/logout", logoutCaptain);
router.get("/stats", getCaptainStats);

module.exports = router;
