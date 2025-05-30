const { TryCatch } = require("../utils/features");
const { instance } = require("../razorpay");
const crypto = require("crypto");
const { ErrorHandler } = require("../utils/errorHandler");
const { prisma } = require("../utils/utility");

const createOrder = TryCatch(async (req, res, next) => {
  const { amount, rideId } = req.body;
  if (!amount) return next(new ErrorHandler("amount required", 400));
  const options = {
    amount: Number(amount * 100), // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
    currency: "INR",
    receipt: "order_rcptid_11",
  };
  const order = await instance.orders.create(options);
  console.log(order);
  await prisma.ride.update({
    where: { id: Number(rideId) },
    data: {
      orderId: order.id,
    },
  });
  return res.status(200).json({
    success: true,
    order,
  });
});

const getPayApiKey = TryCatch(async (req, res, next) => {
  return res.status(200).json({ key: process.env.RAZOR_PAY_KEY_ID });
});

const paymentVerification = TryCatch(async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  console.log("payment verification", req.body);
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZOR_PAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  const isAuthentic = expectedSignature === razorpay_signature;

  if (isAuthentic) {
    // Database comes here

    await prisma.ride.updateMany({
      where: { orderId: razorpay_order_id },
      data: {
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
      },
    });

    res.redirect(
      `http://localhost:3000/paymentsuccess?reference=${razorpay_payment_id}`
    );
  } else {
    res.status(400).json({
      success: false,
    });
  }
});

module.exports = { createOrder, getPayApiKey, paymentVerification };
