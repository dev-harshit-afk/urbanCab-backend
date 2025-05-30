const { ErrorHandler } = require("../utils/errorHandler");
const { TryCatch, emitEvent } = require("../utils/features");
const {
  getFareService,
  getOtp,
  getOnGoingRide,
  getOnGoingRideForCaptain,
} = require("../services/ride.services");
const { prisma } = require("../utils/utility");
const {
  getCaptainsInTheRadius,
  getCoordinatesService,
  getDistanceTimeService,
} = require("../services/map.services");
const { get } = require("../routes/ride.routes");

const createRide = TryCatch(async (req, res, next) => {
  const { pickup, destination, vehicleType } = req.body;
  if (!pickup || !destination || !vehicleType) {
    throw new ErrorHandler("All fields are required");
  }
  console.log("Creating ride");

  const rideExist = await getOnGoingRide(req.user.id);
  if (rideExist) {
    const baseUrl = `${process.env.CLIENT_URL}/user/ride`;
    if (rideExist.status === "pending" || rideExist.status === "accepted") {
      return res.status(200).json({
        redirect: `${baseUrl}/dispatch/${rideExist.id}`,
      });
    } else if (rideExist.status === "ongoing") {
      return res.status(200).json({
        redirect: `${baseUrl}/riding/${rideExist.id}`,
      });
    } else if (rideExist.status === "completed" && !rideExist.paymentId) {
      return res.status(200).json({
        redirect: `${baseUrl}/completePayment/${rideExist.id}`,
      });
    }
  }
  const fare = await getFareService(pickup, destination);

  const otp = getOtp(6);
  const timeAndDuration = await getDistanceTimeService();
  const pickupCoordinates = await getCoordinatesService(pickup);
  console.log(fare, fare[vehicleType]);

  const ride = await prisma.ride.create({
    data: {
      userId: req.user.id,
      pickup,
      destination,
      otp,
      fare: fare[vehicleType],
      pickupLat: pickupCoordinates.lat,
      pickupLong: pickupCoordinates.lng,
      vehicleType: vehicleType,
    },
  });
  res.status(201).json({ message: "ride created successfully...", ride });

  console.log(pickupCoordinates);

  const nearByCaptains = await getCaptainsInTheRadius(
    pickupCoordinates.lat,
    pickupCoordinates.lng,
    500,
    vehicleType
  );
  const rideWithSelectedUser = await prisma.ride.findUnique({
    where: { id: ride.id },
    include: {
      user: {
        select: { id: true, firstname: true, lastname: true, email: true },
      },
    },
  });
  rideWithSelectedUser.otp = "";
  // nearByCaptains = [];
  console.log("here", nearByCaptains);
  nearByCaptains.map(async (captain) => {
    const socketId = captain.socketId;
    if (!socketId) return;
    emitEvent(req, socketId, "new-ride", { ride: rideWithSelectedUser });
  });
});
const getFare = TryCatch(async (req, res, next) => {
  const { pickup, destination } = req.query;
  if (!pickup || !destination) {
    throw new Error("Pickup and destination are required");
  }

  const fares = await getFareService(pickup, destination);
  res.status(200).json({ message: "fares for all ride", fares });
});

const acceptRide = TryCatch(async (req, res, next) => {
  const { rideId, captainId } = req.body;
  if (!rideId || !captainId) {
    throw new ErrorHandler("rideId and CaptainId is required");
  }
  const ride = await prisma.ride.findUnique({
    where: { id: rideId, status: { not: "cancelled" } },
    include: {
      user: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          socketId: true,
        },
      },
      captain: {
        select: { id: true, firstname: true, lastname: true, email: true },
      },
    },
  });
  if (!ride) {
    return next(new ErrorHandler("Ride not found"));
  }

  if (ride.captainId) {
    return next(new ErrorHandler("Ride already accepted"));
  }
  const rideUpated = await prisma.ride.update({
    where: { id: rideId },
    data: { captainId, status: "accepted" },
    include: {
      user: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          socketId: true,
        },
      },
      captain: {
        select: { id: true, firstname: true, lastname: true, email: true },
      },
    },
  });

  emitEvent(req, ride.user.socketId, "ride-accepted", { ride: rideUpated });
  rideUpated.otp = "";

  return res
    .status(200)
    .json({ message: "Ride accepted successfully", ride: rideUpated });
});

const startRide = TryCatch(async (req, res, next) => {
  const { rideId, captainId, otp } = req.body;
  if (!rideId || !captainId || !otp) {
    throw new ErrorHandler("rideId and CaptainId is required");
  }
  const ride = await prisma.ride.findUnique({
    where: { id: rideId, status: "accepted" },
    include: {
      user: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          socketId: true,
        },
      },
      captain: {
        select: { id: true, firstname: true, lastname: true, email: true },
      },
    },
  });
  if (!ride) {
    return next(new ErrorHandler("Ride not found"));
  }

  if (ride.captainId !== captainId) {
    return next(new ErrorHandler("You are not authorized to start this ride"));
  }
  if (ride.otp !== otp) {
    return next(new ErrorHandler("Invalid OTP"));
  }
  const rideUpated = await prisma.ride.update({
    where: { id: rideId },
    data: { status: "ongoing", pickedupAt: new Date() },
    include: {
      user: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          socketId: true,
        },
      },
      captain: {
        select: { id: true, firstname: true, lastname: true, email: true },
      },
    },
  });

  emitEvent(req, ride.user.socketId, "ride-started", { ride });
  return res
    .status(200)
    .json({ message: "Ride started successfully", ride: rideUpated });
});

const rideDetails = TryCatch(async (req, res, next) => {
  const rideId = Number(req.params.rideId);

  if (!rideId) {
    return next(new ErrorHandler("Ride ID is required"));
  }
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: {
      user: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          socketId: true,
        },
      },
      captain: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          vehicleColor: true,
          vehicleType: true,
          vehiclePlate: true,
        },
      },
    },
  });
  if (!ride) {
    return next(new ErrorHandler("Ride not found"));
  }
  if (ride.captainId !== req?.captain?.id && ride.userId !== req?.user?.id) {
    console.log("ride captainId", ride.captainId);
    return next(new ErrorHandler("You are not authorized to view this ride"));
  }

  const pickupCoordinates = await getCoordinatesService(ride.pickup);
  const destinationCoordinates = await getCoordinatesService(ride.destination);
  const distanceTime = await getDistanceTimeService(
    `${pickupCoordinates.lat},${pickupCoordinates.lng}`,
    `${destinationCoordinates.lat},${destinationCoordinates.lng}`
  );
  ride.pickupCoordinates = pickupCoordinates;
  ride.destinationCoordinates = destinationCoordinates;
  ride.distance = (distanceTime.distance.value / 1000).toFixed(2);
  ride.time = (distanceTime.duration.value / 60).toFixed(2);

  return res.status(200).json({ message: "Ride details", ride });
});

const endRide = TryCatch(async (req, res, next) => {
  const rideId = Number(req.params.rideId);

  if (!rideId) {
    return next(new ErrorHandler("Ride ID is required"));
  }
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          socketId: true,
        },
      },
      captain: {
        select: {
          id: true,
          socketId: true,
        },
      },
    },
  });
  if (!ride) {
    return next(new ErrorHandler("Ride not found"));
  }
  if (ride.captainId !== req?.captain?.id && ride.userId !== req?.user?.id) {
    console.log("ride captainId", ride.captainId);
    return next(new ErrorHandler("You are not authorized to view this ride"));
  }

  // if (ride.status !== "ongoing") {
  //   return next(new ErrorHandler("Ride is not ongoing"));
  // }
  const rideUpated = await prisma.ride.update({
    where: { id: rideId },
    data: { status: "completed", droppedAt: new Date() },
    include: {
      user: {
        select: {
          id: true,

          email: true,
          socketId: true,
        },
      },
      captain: {
        select: {
          id: true,

          email: true,
          socketId: true,
        },
      },
    },
  });

  emitEvent(req, ride.user.socketId, "ride-completed", {
    rideId: rideUpated.id,
    user: ride.user,
  });

  return res.status(200).json({ message: "Ride completed Successfully" });
});

const getOnGoingRideDetails = TryCatch(async (req, res, next) => {
  const ride = await getOnGoingRide(req.user.id);

  if (!ride) {
    return next(new ErrorHandler("No ongoing ride found"));
  }
  return res.status(200).json({ message: "Ongoing ride found", ride });
});
const getOnGoingRideDetailsForCaptain = TryCatch(async (req, res, next) => {
  const ride = await getOnGoingRideForCaptain(req.captain.id);

  return res.status(200).json({ message: "Ongoing ride found", ride });
});

const cancelRide = TryCatch(async (req, res, next) => {
  const rideId = Number(req.params.rideId);

  if (!rideId) {
    return next(new ErrorHandler("Ride ID is required"));
  }
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          socketId: true,
        },
      },
      captain: {
        select: {
          id: true,
          socketId: true,
        },
      },
    },
  });
  if (!ride) {
    return next(new ErrorHandler("Ride not found"));
  }
  if (ride.userId !== req?.user?.id) {
    return next(new ErrorHandler("You are not authorized for this ride"));
  }

  if (ride.status !== "pending") {
    return res.status(400).json({
      message: "Ride cannot be cancelled",
      ride: ride,
    });
  }
  await prisma.ride.update({
    where: { id: rideId },
    data: { status: "cancelled" },
  });
  return res.status(200).json({ message: "Ride cancelled Successfully" });
});

const getUserRideHistory = TryCatch(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Get total count for pagination
  const total = await prisma.ride.count({
    where: { userId: req.user.id },
  });

  const rides = await prisma.ride.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
        },
      },
      captain: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
        },
      },
    },
  });

  const totalPages = Math.ceil(total / limit);

  return res.status(200).json({
    message: "Ride history",
    rides,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
});
const getCaptainRideHistory = TryCatch(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Get total count for pagination
  const total = await prisma.ride.count({
    where: { captainId: req.captain.id },
  });

  const rides = await prisma.ride.findMany({
    where: { captainId: req.captain.id },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
        },
      },
    },
  });

  const totalPages = Math.ceil(total / limit);

  return res.status(200).json({
    message: "Ride history",
    rides,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
});

const getNearByPendingRides = TryCatch(async (req, res, next) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return next(new ErrorHandler("Latitude and longitude are required"));
  }

  // 1. Get pending rides created in the last 1 hour (optional, for relevance)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // Use 'gte' (greater than or equal) to get rides created after oneHourAgo (i.e., recent rides)
  // 'lte' (less than or equal) would get older rides, which is not what you want for recent rides.
  const pendingRides = await prisma.ride.findMany({
    where: {
      status: "pending",
      createdAt: { gte: oneHourAgo }, // correct: get recent rides
      pickupLat: { not: null },
      pickupLong: { not: null },
      vehicleType: req.captain.vehicleType,
    },
    include: {
      user: {
        select: { id: true, firstname: true, lastname: true, email: true },
      },
    },
  });

  function haversine(lat1, lng1, lat2, lng2) {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  const nearbyRides = pendingRides
    .map((ride) => {
      const distance = haversine(
        Number(lat),
        Number(lng),
        Number(ride.pickupLat),
        Number(ride.pickupLong)
      );
      return { ...ride, distance };
    })
    .filter((ride) => ride.distance <= 5);

  nearbyRides.sort((a, b) => a.distance - b.distance);

  return res.status(200).json({
    message: "Nearby pending rides within 5km",
    rides: nearbyRides,
  });
});

const rateRide = TryCatch(async (req, res, next) => {
  const { rideId } = req.params;
  const { rating } = req.body;

  if (!rideId || !rating) {
    return next(new ErrorHandler("Ride ID and rating are required"));
  }

  const ride = await prisma.ride.findUnique({
    where: { id: Number(rideId) },
    include: {
      user: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!ride) {
    return next(new ErrorHandler("Ride not found"));
  }

  if (ride.rating !== 0) {
    return res.status(200).json({
      message: "Ride already rated",
    });
  }

  if (ride.userId !== req.user.id) {
    return next(new ErrorHandler("You are not authorized to rate this ride"));
  }

  const updatedRide = await prisma.ride.update({
    where: { id: Number(rideId) },
    data: { rating: Number(rating) },
  });

  return res.status(200).json({
    message: "Ride rated successfully",
  });
});

module.exports = {
  createRide,
  getFare,
  acceptRide,
  startRide,
  rideDetails,
  endRide,
  getOnGoingRideDetails,
  cancelRide,
  getUserRideHistory,
  getCaptainRideHistory,
  getOnGoingRideDetailsForCaptain,
  getNearByPendingRides,
  rateRide,
};
