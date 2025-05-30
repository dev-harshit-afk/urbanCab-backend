const { body, validationResult, query } = require("express-validator");
const { ErrorHandler } = require("../utils/errorHandler");

const validatorHandler = (req, res, next) => {
  const errors = validationResult(req);
  const errorMessages = errors
    .array()
    .map((error) => error.msg)
    .join(",");

  if (errors.isEmpty()) return next();

  return next(new ErrorHandler(errorMessages, 400));
};

const userRegisterValidator = () => [
  body("email").isEmail().withMessage("Invalid Email"),
  body("firstname")
    .isLength({ min: 3 })
    .withMessage("First name should be at least 3 character"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be min 6 character long"),
];

const captainRegisterValidator = () => [
  body("email").isEmail().withMessage("Invalid Email"),
  body("firstname")
    .isLength({ min: 3 })
    .withMessage("First name should be at least 3 character"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be min 6 character long"),
  body("vehiclePlate")
    .isLength({ min: 6 })
    .withMessage("Kindly provide valid number plate"),
  body("vehicleCapacity")
    .isInt()
    .withMessage("Kindly provide capacity in number"),
  body("vehicleType", "Kindly provide valid vehicle type"),
];

const LoginValidator = () => [
  body("email").isEmail().withMessage("kindly provide valid Email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be min 6 character long"),
];

const getDistanceTimeValidator = () => [
  query("origin").isString().isLength({ min: 3 }),
  query("destination").isString().isLength({ min: 3 }),
];

const getCoordinatesValidator = () => [
  query("address").isString().isLength({ min: 3 }),
];

const getSuggestionsValidator = () => [
  query("input").isString().isLength({ min: 3 }),
];
const createRideValidator = () => [
  body("pickup")
    .isString()
    .isLength({ min: 3 })
    .withMessage("Invalid pickup address"),
  body("destination")
    .isString()
    .isLength({ min: 3 })
    .withMessage("Invalid destination address"),
  body("vehicleType")
    .isString()
    .isIn(["auto", "car", "bike"])
    .withMessage("Invalid vehicle type"),
];

const getFareValidator = () => [
  query("pickup")
    .isString()
    .isLength({ min: 3 })
    .withMessage("Invalid pickup address"),
  query("destination")
    .isString()
    .isLength({ min: 3 })
    .withMessage("Invalid destination address"),
];

const acceptRideValidator = () => [
  body("rideId", "please provide ride id"),
  body("captainId", "please provide captain id"),
];

const startRideValidator = () => [
  body("rideId", "please provide ride id"),
  body("captainId", "please provide captain id"),
  body("otp", "Invalid otp"),
];

module.exports = {
  validatorHandler,
  userRegisterValidator,
  captainRegisterValidator,
  LoginValidator,
  getDistanceTimeValidator,
  getCoordinatesValidator,
  createRideValidator,
  getSuggestionsValidator,
  getFareValidator,
  acceptRideValidator,
  startRideValidator,
};
