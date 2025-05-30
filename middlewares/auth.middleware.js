const jwt = require("jsonwebtoken");
const { prisma } = require("../utils/utility");
const { VehicleType } = require("../generated/client");

const authUser = async (req, res, next) => {
  const token =
    req.cookies["rider-token"] || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorize" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded._id },
      select: {
        firstname: true,
        lastname: true,
        email: true,
        id: true,
      },
    });
    req.user = user;

    return next();
  } catch (error) {
    console.log(error);
    return res
      .status(401)
      .json({ message: "Something went wrong... try again later" });
  }
};

const authCaptain = async (req, res, next) => {
  const token =
    req.cookies["captain-token"] || req.headers.authorization?.split(" ")[1];

  if (!token) {
    console.log("No token found");
    return res.status(401).json({ message: "Unauthorize" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const captain = await prisma.captain.findUnique({
      where: { id: decoded._id },
      select: {
        firstname: true,
        lastname: true,
        email: true,
        vehicleCapacity: true,
        vehiclePlate: true,
        vehicleType: true,
        latitude: true,
        longitude: true,
        id: true,
        vehicleColor: true,
      },
    });
    req.captain = captain;

    return next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({ message: "Something went wrong..." });
  }
};

const authAny = async (req, res, next) => {
  const token =
    req.cookies["captain-token"] ||
    req.cookies["rider-token"] ||
    req.headers.authorization?.split(" ")[1];
  console.log(token);
  if (!token) {
    return res.status(401).json({ message: "Unauthorize" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded);

    if (decoded.role === "captain") {
      const captain = await prisma.captain.findUnique({
        where: { id: decoded._id },
        select: {
          firstname: true,
          lastname: true,
          email: true,
          vehicleCapacity: true,
          vehiclePlate: true,
          vehicleType: true,
          latitude: true,
          longitude: true,
          id: true,
        },
      });
      req.captain = captain;
      return next();
    }
    if (decoded.role === "user") {
      const user = await prisma.user.findUnique({
        where: { id: decoded._id },
        select: {
          firstname: true,
          lastname: true,
          email: true,
          id: true,
        },
      });
      req.user = user;
      return next();
    }

    return res.status(401).json({ message: "Unauthorize" });
  } catch (error) {
    console.log(error);
    return res.status(401).json({ message: "Something went wrong..." });
  }
};

module.exports = { authUser, authCaptain, authAny };
