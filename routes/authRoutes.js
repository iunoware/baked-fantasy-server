import express from "express";
// import { registerUser, loginUser } from "../controllers/authController.js";
import User from "../models/user.js";
import Otp from "../models/otp.js";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// for google login
router.post("/google-login", async (req, res) => {
  try {
    const { token } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        password: "",
      });
    }

    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({ msg: "Google Login Success", token: jwtToken, user });
  } catch (err) {
    console.error("Google Login error", err);
    res.status(500).json({ error: "Google Login Failed" });
  }
});

// for user registration
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, mobileNumber, purchasedCourses } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ msg: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      mobileNumber,
      password: hashedPassword,
      purchasedCourses,
    });

    res.json({ msg: "User registered successfully", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// for user login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({ msg: "Login success", token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/send-otp", async (req, res) => {
  try {
    const { email, type } = req.body;
    const otp = generateOTP();

    await Otp.deleteMany({ email, type });

    await Otp.create({
      email,
      otp,
      type,
    });
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your verification OTP is: ${otp}`,
    });

    res.json({ msg: "OTP sent successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp, type } = req.body;

    const record = await Otp.findOne({
      email,
      otp: otp.toString(),
      type,
    });

    if (!record) {
      return res.status(400).json({ msg: "Invalid or expired OTP" });
    }

    await Otp.deleteMany({ email, type });

    res.json({ msg: "OTP verified successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
