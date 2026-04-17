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
      image: req.file ? `/uploads/${req.file.filename}` : null, // fixed field name
      active: req.body.active,
      endDate: req.body.endDate,
    });
    res.status(201).json(banner);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// edit the Banner
// router.patch("/banner", upload.single("image"), async (req, res) => {
//   try {
//     const { title, subject, active } = req.body;

//     const updateData = {
//       title,
//       subject,
//       active,
//       endDate: active ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) : null,
//     };
//     if (req.file) {
//       updateData.image = `/uploads/${req.file.filename}`;
//     }
//     const updatedData = await Banner.findOneAndUpdate({}, updateData, {
//       new: true,
//       upsert: true,
//     });

//     res.status(200).json({
//       message: "Banner Updated Successfully",
//       banner: updatedData,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Failed to update banner" });
//   }
// });
router.patch("/banner", upload.single("image"), async (req, res) => {
  try {
    const { title, subject, active, endDate } = req.body;

    // const updateData = { title, subject, active };
    const updateData = {};
    if (title) updateData.title = title;
    if (subject) updateData.subject = subject;
    if (endDate) updateData.endDate = new Date(endDate);

    // always parse active as a proper boolean
    updateData.active = active === "true" || active === true;

    if (endDate) {
      updateData.endDate = new Date(endDate);
    }

    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const updatedData = await Banner.findOneAndUpdate({}, updateData, {
      new: true,
      upsert: true,
    });

    res.status(200).json({
      message: "Banner Updated Successfully",
      banner: updatedData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update banner" });
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

// get active banner
router.get("/banner/active", async (req, res) => {
  try {
    const today = new Date();
    const banner = await Banner.findOne({
      active: true,
      endDate: { $gte: today },
    });
    // console.log(banner);
    res.json(banner);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// get single Banner
router.get("/banner/:id", async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ error: "Banner not found" });
    // console.log(banner);
    res.json(banner);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
