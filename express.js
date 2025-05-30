const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const userRoute = require("./routes/user.routes");
const captainRoute = require("./routes/captain.routes");
const mapRoute = require("./routes/map.routes");
const rideRoute = require("./routes/ride.routes");
const paymentRoute = require("./routes/payment.routes");

const cors = require("cors");
const cookieParser = require("cookie-parser");
const errorMiddleWare = require("./middlewares/error.middleware");
const app = express();
app.use(
  cors({
    origin: [
      "https://949m5q5k-3000.inc1.devtunnels.ms",
      "http://localhost:3000",
      "https://urban-cab.vercel.app",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("heloo world");
});

app.use("/users", userRoute);
app.use("/captains", captainRoute);
app.use("/maps", mapRoute);
app.use("/ride", rideRoute);
app.use("/payment", paymentRoute);

app.use(errorMiddleWare);

module.exports = app;
