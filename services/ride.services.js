const { prisma } = require("../utils/utility");
const { getDistanceTimeService } = require("./map.services");
const crypto = require("crypto");

const getFareService = async (pickup, destination) => {
  if (!pickup || !destination) {
    throw new Error("Pickup and destination are required");
  }

  const distanceTime = await getDistanceTimeService(pickup, destination);

  const baseFare = {
    auto: 30,
    car: 50,
    bike: 20,
  };

  const perKmRate = {
    auto: 10,
    car: 15,
    bike: 8,
  };

  const perMinuteRate = {
    auto: 2,
    car: 3,
    bike: 1.5,
  };

  const fare = {
    auto: Math.round(
      baseFare.auto +
        (distanceTime.distance.value / 1000) * perKmRate.auto +
        (distanceTime.duration.value / 60) * perMinuteRate.auto
    ),
    car: Math.round(
      baseFare.car +
        (distanceTime.distance.value / 1000) * perKmRate.car +
        (distanceTime.duration.value / 60) * perMinuteRate.car
    ),
    bike: Math.round(
      baseFare.bike +
        (distanceTime.distance.value / 1000) * perKmRate.bike +
        (distanceTime.duration.value / 60) * perMinuteRate.bike
    ),
  };

  return fare;
};
function getOtp(num) {
  function generateOtp(num) {
    const otp = crypto
      .randomInt(Math.pow(10, num - 1), Math.pow(10, num))
      .toString();
    return otp;
  }
  return generateOtp(num);
}

const getOnGoingRide = async (userId) => {
  const ride = await prisma.ride.findFirst({
    orderBy: {
      createdAt: "desc",
    },
    where: {
      status: { not: "cancelled" },
      paymentId: null,
      userId: userId,
    },
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
  return ride;
};
const getOnGoingRideForCaptain = async (captainId) => {
  const ride = await prisma.ride.findFirst({
    orderBy: {
      createdAt: "desc",
    },
    where: {
      status: { in: ["ongoing", "accepted"] },

      captainId: captainId,
    },
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
  return ride;
};

module.exports = {
  getFareService,
  getOtp,
  getOnGoingRide,
  getOnGoingRideForCaptain,
};
