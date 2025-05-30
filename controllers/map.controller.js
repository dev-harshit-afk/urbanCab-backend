const { ErrorHandler } = require("../utils/errorHandler");
const { TryCatch } = require("../utils/features");
const {
  getDistanceTimeService,
  getCoordinatesService,
} = require("../services/map.services");

const axios = require("axios");

const getCoordinates = TryCatch(async (req, res, next) => {
  const { address } = req.query;
  if (!address) return next(new ErrorHandler("Kindly provide a address", 401));

  const coordinates = await getCoordinatesService(address);
  if (!coordinates) return next(new ErrorHandler("No coordinates found"));

  res
    .status(200)
    .json({ message: "coordinates fetched successfully...", coordinates });
});
const getDistanceTime = TryCatch(async (req, res, next) => {
  const { origin, destination } = req.query;
  if (!origin || !destination)
    return next(new ErrorHandler("Origin and distance required"));

  const distanceTime = await getDistanceTimeService(origin, destination);

  res
    .status(200)
    .json({ message: "distanceTime fetched successfully...", distanceTime });
});

const getSuggestions = TryCatch(async (req, res, next) => {
  const { input } = req.query;

  const apiKey = process.env.GOOGLE_MAPS_API;

  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
    input
  )}&key=${apiKey}`;

  const response = await axios.get(url);

  const suggestions = response.data.predictions;

  res
    .status(200)
    .json({ message: "suggestions fetched successfully...", suggestions });
});

module.exports = { getCoordinates, getDistanceTime, getSuggestions };
