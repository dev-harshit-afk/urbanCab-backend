const { TryCatch, cookieOptions } = require("../utils/features");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { prisma } = require("../utils/utility");
const { ErrorHandler } = require("../utils/errorHandler");
const registerCaptain = TryCatch(async (req, res, next) => {
  const {
    firstname,
    lastname,
    email,
    password,
    vehicleColor,
    vehiclePlate,
    vehicleCapacity,
    vehicleType,
  } = req.body;

  const checkCaptian = await prisma.captain.findUnique({
    where: { email: email },
  });
  if (checkCaptian) {
    return next(new ErrorHandler("Captian already exist", 400));
  }

  const hashedpassword = await bcrypt.hash(password, 10);

  const captain = await prisma.captain.create({
    data: {
      firstname,
      lastname,
      email,
      password: hashedpassword,
      vehiclePlate,
      vehicleCapacity: Number(vehicleCapacity),
      vehicleColor,
      vehicleType,
    },
  });

  const { password: temp, ...safeCaptainDetails } = captain;

  return res.status(200).json({
    message: "Captain account created...",
    captain: safeCaptainDetails,
  });
});

const loginCaptain = TryCatch(async (req, res, next) => {
  const { email, password } = req.body;

  const captain = await prisma.captain.findUnique({ where: { email: email } });

  if (!captain)
    return next(new ErrorHandler("Invalid username or password", 400));

  const validatePassword = await bcrypt.compare(password, captain.password);

  if (!validatePassword)
    return next(new ErrorHandler("Invalid username or password", 400));

  //generate token
  const token = jwt.sign(
    { _id: captain.id, role: "captain" },
    process.env.JWT_SECRET
  );
  const { password: tempSaved, ...safeCaptainDetails } = captain;

  return res.status(201).cookie("captain-token", token, cookieOptions).json({
    sucsess: true,
    message: `Welcome Captain..`,
    captain: safeCaptainDetails,
    token: token,
  });
});

const getCaptainProfile = TryCatch(async (req, res, next) => {
  const captainId = req.captain.id;

  const rides = await prisma.ride.findMany({
    where: { captainId, status: "completed" },
    select: {
      duration: true,
      distance: true,
      fare: true,
      rating: true,
    },
  });

  const totalRides = rides.length;
  const totalTime = rides.reduce((sum, ride) => sum + (ride.duration || 0), 0);
  const totalDistance = rides.reduce(
    (sum, ride) => sum + (ride.distance || 0),
    0
  );
  const totalFares = rides.reduce((sum, ride) => sum + (ride.fare || 0), 0);

  // Calculate average rating out of 5
  const ratings = rides
    .map((ride) => ride.rating)
    .filter((r) => typeof r === "number");
  const averageRating = ratings.length
    ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(2)
    : null;

  const captain = {
    ...req.captain,
    totalRides,
    totalTime,
    totalDistance,
    totalFares,
    averageRating: averageRating ? Number(averageRating) : "No ratings yet",
  };
  return res
    .status(200)
    .json({ message: "Captain profiled fecthed", captain: captain });
});
const logoutCaptain = TryCatch(async (req, res, next) => {
  return res
    .status(200)
    .cookie("captain-token", "", { ...cookieOptions, maxAge: 0 })
    .json({ message: "logout successfull" });
});

const getCaptainStats = TryCatch(async (req, res, next) => {
  const captainId = req.captain.id;

  const rides = await prisma.ride.findMany({
    where: { captainId, status: "COMPLETED" },
    select: {
      duration: true,
      distance: true,
      fare: true,
      rating: true,
    },
  });

  const totalRides = rides.length;
  const totalTime = rides.reduce((sum, ride) => sum + (ride.duration || 0), 0);
  const totalDistance = rides.reduce(
    (sum, ride) => sum + (ride.distance || 0),
    0
  );
  const totalFares = rides.reduce((sum, ride) => sum + (ride.fare || 0), 0);

  // Calculate average rating out of 5
  const ratings = rides
    .map((ride) => ride.rating)
    .filter((r) => typeof r === "number");
  const averageRating = ratings.length
    ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(2)
    : null;

  return res.status(200).json({
    totalRides,
    totalTime,
    totalDistance,
    totalFares,
    averageRating: averageRating ? Number(averageRating) : "No ratings yet",
  });
});

module.exports = {
  registerCaptain,
  loginCaptain,
  getCaptainProfile,
  logoutCaptain,
  getCaptainStats,
};
