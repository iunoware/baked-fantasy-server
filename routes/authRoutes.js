// login changes made
// for pushing issue

import express from "express";
// import { registerUser, loginUser } from "../controllers/authController.js";
import User from "../models/user.js";
import Otp from "../models/otp.js";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import authMiddleware from "../middleware/authmiddleware.js";
import Address from "../models/address.js";

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// to get all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .populate("addresses")
      .populate("orders")
      .populate("purchasedCourses.courseId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      msg: "Users fetched successfully",
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: error.message });
  }
});

// to find the user has address
router.get("/has-address", authMiddleware, async (req, res) => {
  const count = await Address.countDocuments({ userId: req.user._id });
  console.log("userId:", req.user._id, "address count:", count); // 👈 add this
  res.json({ hasAddress: count > 0 });
});

// for single user data
router.get("/me", authMiddleware, async (req, res) => {
  res.json({ user: req.user });
});

// for google login
router.post("/google-login", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, picture, sub } = payload;

    if (!email) {
      return res
        .status(400)
        .json({ error: "Google account does not have an email" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: name || email.split("@")[0],
        email: email,
        password: null,
        provider: "google",
        role: "user",
      });
    } else {
      if (user.provider !== "google") {
        user.provider = "google";
        await user.save();
      }
    }

    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // Set httpOnly cookie instead of sending token in response
    res.cookie("authToken", jwtToken, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === "production",
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      path: "/",
    });

    // Return user data without token
    res.json({ msg: "Google Login Success", user });
  } catch (err) {
    console.error("GOOGLE LOGIN ERROR DETAILS:", err);
    res.status(500).json({
      error: "Google Login Failed",
      details: err.message,
    });
  }
});

// for user registration
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, mobileNumber, purchasedCourses, provider } =
      req.body;

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

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // Set httpOnly cookie
    res.cookie("authToken", token, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === "production",
      secure: false,
      // sameSite: "strict",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      path: "/",
    });

    // Return user data without token
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

    // Set httpOnly cookie
    res.cookie("authToken", token, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === "production",
      secure: false,
      // sameSite: "strict",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      path: "/",
    });

    // Return user data without token
    res.json({ msg: "Login success", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// for modifying user details
router.patch("/update-profile", async (req, res) => {
  try {
    const { name, email, mobileNumber, address } = req.body;

    const user = await User.findOneAndUpdate(
      { email: email },
      { $set: { name, mobileNumber, address } },
      { new: true },
    );

    if (!user) return res.status(404).json({ msg: "User not found" });

    res.json({ msg: "Profile updated successfully", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a LOGOUT route (NEW)
router.post("/logout", (req, res) => {
  res.clearCookie("authToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  res.clearCookie("isAdmin", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  res.json({ msg: "Logged out successfully" });
});

router.post("/send-otp", async (req, res) => {
  try {
    const { email, type } = req.body;

    const existingUser = await User.findOne({ email });

    // Registration check
    if (type === "register" && existingUser) {
      if (existingUser.provider === "google") {
        return res.status(400).json({
          msg: "This email is registered with Google. Please login using Google.",
        });
      }

      return res.status(400).json({
        msg: "User already exists. Please login.",
      });
    }

    // Reset password check
    if (type === "reset") {
      if (!existingUser) {
        return res.status(400).json({
          msg: "No account found with this email.",
        });
      }
      if (existingUser.provider === "google") {
        return res.status(400).json({
          msg: "This account uses Google login. Please login with Google.",
        });
      }
    }

    const otp = generateOTP();

    await Otp.deleteMany({ email, type });

    await Otp.create({
      email,
      otp,
      type,
    });

    await transporter.sendMail({
      from: `"Baked Fantasy" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Verification Code",
      html: `
  <div style="font-family: Arial, sans-serif; background:#f6f8fb; padding:40px 0;">
    <table align="center" width="100%" style="max-width:520px;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 6px 18px rgba(0,0,0,0.08)">
      
      <!-- Header -->
      <tr>
        <td style="background:#ec4174;padding:20px;text-align:center">
          <h2 style="color: #fff">THE BAKED FANTASY </h2>
        </td>
      </tr>

      <!-- Content -->
      <tr>
        <td style="padding:30px 30px 10px 30px;text-align:center">
          <h2 style="margin:0;color:#333;">Verify Your Email</h2>
          <p style="color:#666;font-size:15px;margin-top:10px">
            Use the verification code below to continue creating your account.
          </p>
        </td>
      </tr>

      <!-- OTP Box -->
      <tr>
        <td style="text-align:center;padding:20px">
          <div style="
            display:inline-block;
            padding:14px 28px;
            font-size:28px;
            letter-spacing:6px;
            font-weight:bold;
            color:#ec4174;
            background:#fff3f7;
            border-radius:8px;
            border:1px dashed #ec4174;
          ">
            ${otp}
          </div>
        </td>
      </tr>

      <!-- Expiration -->
      <tr>
        <td style="text-align:center;padding:10px 30px">
          <p style="font-size:13px;color:#999;margin:0">
            This OTP is valid for <strong>5 minutes</strong>.
          </p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding:30px;text-align:center;border-top:1px solid #eee">
          <p style="font-size:12px;color:#999;margin:0">
            If you did not request this code, please ignore this email.
          </p>
          <p style="font-size:12px;color:#aaa;margin-top:6px">
            © ${new Date().getFullYear()} Baked Fantasy
          </p>
        </td>
      </tr>

    </table>
  </div>
  `,
    });

    res.json({ msg: "OTP sent successfully" });
  } catch (err) {
    console.error(err);
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

router.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res
        .status(400)
        .json({ msg: "Email and new password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ msg: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
