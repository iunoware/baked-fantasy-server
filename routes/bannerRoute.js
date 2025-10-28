import express from "express";
import multer from "multer";
import Banner from "../models/banner.js";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// accept multiple images
const upload = multer({ storage });

async function verifyAdmin(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1]?.trim();
    if (!token) return res.status(401).json({ msg: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.role !== "admin") {
      return res.status(403).json({ msg: "access denied" });
    }
    res.user = user;
    next();
  } catch (error) {
    res.status(400).json({ msg: "something went wrong", error: error.message });
  }
}

// create Banner
router.post("/banner", upload.single("image"), async (req, res) => {
  try {
    const banner = await Banner.create({
      title: req.body.title,
      subject: req.body.subject,
      image: req.file ? `/uploads/${req.file.filename}` : null, // ✅ fixed field name
    });
    res.status(201).json(banner);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Get all Banner
router.get("/banner", async (req, res) => {
  try {
    const banners = await Banner.find();
    res.json(banners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// get single Banner
router.get("/banner/:id", async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ error: "Banner not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
