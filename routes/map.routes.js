const express = require("express");
const {
  getCoordinates,
  getDistanceTime,
  getSuggestions,
} = require("../controllers/map.controller");
const { query } = require("express-validator");
const {
  validatorHandler,
  getCoordinatesValidator,
  getDistanceTimeValidator,
  getSuggestionsValidator,
} = require("../lib/validators");
const { authUser } = require("../middlewares/auth.middleware");
const router = express.Router();

router.use(authUser);
router.get(
  "/get-coordinates",
  getCoordinatesValidator(),
  validatorHandler,
  getCoordinates
);

router.get(
  "/get-distance-time",
  getDistanceTimeValidator(),
  validatorHandler,
  getDistanceTime
);
router.get(
  "/get-suggestions",
  getSuggestionsValidator(),
  validatorHandler,
  getSuggestions
);

module.exports = router;
