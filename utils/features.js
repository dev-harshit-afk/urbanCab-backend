const cookieOptions = {
  maxAge: 15 * 24 * 60 * 60 * 1000,
  sameSite: "none",
  httpOnly: true,
  secure: true,
};

const TryCatch = (passedFunction) => async (req, res, next) => {
  try {
    await passedFunction(req, res, next);
  } catch (error) {
    console.log("error", error);
    next(error);
  }
};

const emitEvent = (req, socketId, event, data) => {
  console.log("Emitting event:", event, "to socketId:", socketId, "data", data);
  const io = req.app.get("io");
  io.to(socketId).emit(event, data);
};

module.exports = { cookieOptions, TryCatch, emitEvent };
