const { ErrorHandler } = require("../utils/errorHandler");
const axios = require("axios");
const { prisma } = require("../utils/utility");
const { TryCatch } = require("../utils/features");

const getDistanceTimeService = async (origin, destination) => {
  if (!origin || !destination)
    return new ErrorHandler("Origin and distance required");
  const apiKey = process.env.GOOGLE_MAPS_API;

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
    origin
  )}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;

  const response = await axios.get(url);

  const distanceTime = response.data.rows[0].elements[0];
  if (distanceTime.status === "ZERO_RESULTS")
    return new ErrorHandler("No routes found");
  return distanceTime;
};

const getCoordinatesService = async (address) => {
  if (!address) return new ErrorHandler("Kindly provide a address", 401);

  const apiKey = process.env.GOOGLE_MAPS_API;

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${apiKey}`;

  const response = await axios.get(url);

  const coordinates = response.data.results[0].geometry.location;
  if (!coordinates) return new ErrorHandler("No coordinates found");
  return coordinates;
};

const getCaptainsInTheRadius = async (lat, lng, radius, vehicleType) => {
  // radius in km

  const captains = await prisma.$queryRaw`
    SELECT *, (
      6371 * acos(
        cos(radians(${lat}))
        * cos(radians(latitude))
        * cos(radians(longitude) - radians(${lng}))
        + sin(radians(${lat})) * sin(radians(latitude))
      )
    ) AS distance
    FROM "Captain"
    WHERE (
      6371 * acos(
        cos(radians(${lat}))
        * cos(radians(latitude))
        * cos(radians(longitude) - radians(${lng}))
        + sin(radians(${lat})) * sin(radians(latitude))
      )
    ) < ${radius}  AND "vehicleType" = ${vehicleType}::"VehicleType"
    ORDER BY distance ASC
  `;
  return captains;
};

module.exports = {
  getDistanceTimeService,
  getCaptainsInTheRadius,
  getCoordinatesService,
};
