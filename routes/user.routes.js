const express = require("express");
const { body } = require("express-validator");
const {
  registerUser,
  loginUser,
  getUserProfile,
  logoutUser,
} = require("../controllers/user.controller");
const { authUser } = require("../middlewares/auth.middleware");
const { LoginValidator } = require("../lib/validators");

const router = express.Router();

router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Invalid Email"),
    body("firstname")
      .isLength({ min: 3 })
      .withMessage("First name should be at least 3 character"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be min 6 character long"),
  ],
  registerUser
);
router.post("/login", LoginValidator(), loginUser);
router.use(authUser);
router.get("/profile", getUserProfile);
router.get("/logout", logoutUser);

module.exports = router;
