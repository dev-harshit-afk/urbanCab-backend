const express = require("express");
const { body } = require("express-validator");
const {
  validatorHandler,
  createRideValidator,
  getFareValidator,
  acceptRideValidator,
} = require("../lib/validators");
const {
  createRide,
  getFare,
  acceptRide,
  startRide,
  rideDetails,
  endRide,
  getOnGoingRideDetails,
  cancelRide,
  getUserRideHistory,
  getOnGoingRideDetailsForCaptain,
  getCaptainRideHistory,
  getNearByPendingRides,
  rateRide,
} = require("../controllers/ride.controller");
const {
  authUser,
  authCaptain,
  authAny,
} = require("../middlewares/auth.middleware");

const router = express.Router();

router.post(
  "/create",
  authUser,
  createRideValidator(),
  validatorHandler,
  createRide
);
router.get("/getFare", authUser, getFareValidator(), validatorHandler, getFare);

router.post(
  "/acceptRide",
  authCaptain,
  acceptRideValidator(),
  validatorHandler,
  acceptRide
);
router.post(
  "/startRide",
  authCaptain,
  acceptRideValidator(),
  validatorHandler,
  startRide
);
router.get("/rideDetails/:rideId", authAny, rideDetails);
router.post("/endRide/:rideId", authCaptain, endRide);
router.get("/ongoingRide", authUser, getOnGoingRideDetails);
router.get(
  "/captain-ongoingRide",
  authCaptain,
  getOnGoingRideDetailsForCaptain
);
router.post("/cancelRide/:rideId", authUser, cancelRide);
router.get("/userRideHistory", authUser, getUserRideHistory);
router.get("/captainRideHistory", authCaptain, getCaptainRideHistory);
router.get("/getAvailablePendingRides", authCaptain, getNearByPendingRides);
router.post("/rateRide/:rideId", authUser, rateRide);

module.exports = router;
