const { Server } = require("socket.io");
const { prisma } = require("./utils/utility");
const app = require("./express");

function socketInitialize(server) {
  const io = new Server(server, {
    cors: {
      origin: [
        "https://949m5q5k-3000.inc1.devtunnels.ms",
        "http://localhost:3000",
      ],
      methods: ["GET", "POST"],
    },
  });

  app.set("io", io);
  io.on("connection", (socket) => {
    console.log("a user connected", socket.id);

    socket.on("join", async (data) => {
      const { userId, userType } = data;
      console.log(userId, userType);
      if (userType === "user") {
        await prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            socketId: socket.id,
          },
        });
      } else if (userType === "captain") {
        await prisma.captain.update({
          where: {
            id: userId,
          },
          data: {
            socketId: socket.id,
          },
        });
      }
    });

    socket.on("update-location-captain", async (data) => {
      const { userId, lat, lng } = data;
      console.log(userId, lat, lng);
      if (!userId || !lat || !lng) return socket.emit("error", "Invalid data");
      await prisma.captain.update({
        where: {
          id: userId,
        },
        data: {
          latitude: lat,
          longitude: lng,
        },
      });
    });

    socket.on("message", (data) => {
      console.log(data);
      socket.emit("message", "hello from server");
    });

    socket.on("disconnect", () => {
      console.log("user disconnected");
    });
  });
}

module.exports = { socketInitialize };
