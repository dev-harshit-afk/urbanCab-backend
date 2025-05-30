const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { cookieOptions } = require("../utils/features");
const { prisma } = require("../utils/utility");

const registerUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstname, lastname, email, password } = req.body;

    if (!firstname || !email || !password) {
      return res.status(400).json({ message: "kindly provide complete data" });
    }
    const checkUser = await prisma.user.findUnique({ where: { email: email } });
    if (checkUser)
      return res.status(400).json({ message: "user already exist" });

    const hashPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        firstname,
        email,
        lastname,
        password: hashPassword,
      },
    });

    return res
      .status(201)
      .json({ message: "User registered successfully...", user: user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error occured" });
  }
};

const loginUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array(),
    });
  }

  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email: email } });
  if (!user) {
    return res
      .status(400)
      .json({ message: "Either the useremail or password is incorrect" });
  }
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res
      .status(400)
      .json({ message: "Either the useremail or password is incorrect" });
  }

  //generate token
  const token = jwt.sign(
    { _id: user.id, role: "user" },
    process.env.JWT_SECRET
  );
  const { password: tempSaved, ...sanitizeUser } = user;

  return res
    .status(200)
    .cookie("rider-token", token, cookieOptions)
    .json({ message: "Welcome back", user: sanitizeUser, token });
};

const getUserProfile = async (req, res, next) => {
  try {
    return res
      .status(200)
      .json({ message: "user profiled fecthed", user: req.user });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "error occurred.. please try again laters" });
  }
};

const logoutUser = async (req, res, next) => {
  try {
    return res
      .status(200)
      .cookie("rider-token", "", { ...cookieOptions, maxAge: 0 })
      .json({ message: "logout successfull" });
  } catch (error) {}
};
module.exports = { registerUser, loginUser, getUserProfile, logoutUser };
