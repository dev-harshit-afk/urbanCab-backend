const express = require("express");
const { authUser } = require("../middlewares/auth.middleware");
const {
  createOrder,
  getPayApiKey,
  paymentVerification,
} = require("../controllers/payment.controller");
const router = express.Router();

router.post("/order", createOrder);
router.get("/getApiKey", authUser, getPayApiKey);
router.post("/paymentVerification", paymentVerification);

module.exports = router;
