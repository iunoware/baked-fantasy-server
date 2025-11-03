import jwt from "jsonwebtoken";
import express from "express";
import bcrypt from "bcryptjs";
import Admin from "../models/admin.js";
import verifyAdmin from "../middleware/tokenverify.js";

const router = express.Router();

// POST: Register admin
router.post("/admin/user", async (req, res) => {
  try {
    const { name, password, isMaster } = req.body;

    if (!name || !password) {
      return res.status(400).json({ msg: "Name and password required" });
    }

    const userExists = await Admin.findOne({ name });
    if (userExists) {
      return res.status(400).json({ msg: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await Admin.create({
      name,
      password: hashedPassword,
      isMaster,
    });

    res.status(201).json({ msg: "Admin registered successfully", admin });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Verify admin login
router.post("/admin/login", async (req, res) => {
  try {
    const { name, password } = req.body;

    // 1️⃣ Check empty fields
    if (!name || !password) {
      return res.status(400).json({ msg: "Name and password required" });
    }

    // 2️⃣ Find the admin in DB
    const admin = await Admin.findOne({ name });
    if (!admin) {
      return res.status(404).json({ msg: "Admin not found" });
    }

    // 3️⃣ Verify password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ msg: "Password incorrect" });
    }

    // 4️⃣ Create JWT token
    const token = jwt.sign(
      { id: admin._id, name: admin.name, isMaster: admin.isMaster },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(200).json({
      msg: "Login successful",
      token,
      admin: {
        name: admin.name,
        isMaster: admin.isMaster,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Create a new admin by master admin
router.post("/admin/newUser", async (req, res) => {
  try {
    const { name, password, confirmPass, masterName, masterPassword } =
      req.body;

    // 1️⃣ Check all fields
    if (!name || !password || !confirmPass || !masterName || !masterPassword) {
      return res.status(400).json({ msg: "All fields required" });
    }

    // 2️⃣ Confirm password match
    if (password !== confirmPass) {
      return res.status(400).json({ msg: "Passwords do not match" });
    }

    // 3️⃣ Verify master admin
    const master = await Admin.findOne({ name: masterName, isMaster: true });
    if (!master) {
      return res.status(404).json({ msg: "Master admin not found" });
    }

    const isMatch = await bcrypt.compare(masterPassword, master.password);
    if (!isMatch) {
      return res.status(401).json({ msg: "Invalid master password" });
    }

    // 4️⃣ Check duplicate admin
    const userExists = await Admin.findOne({ name });
    if (userExists) {
      return res.status(400).json({ msg: "Admin already exists" });
    }

    // 5️⃣ Hash new admin password
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = await Admin.create({
      name,
      password: hashedPassword,
      isMaster: false,
    });

    res.status(201).json({ msg: "New admin created successfully", newAdmin });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Example of a protected admin route
router.get("/admin/dashboard", verifyAdmin, (req, res) => {
  res.status(200).json({
    msg: "Welcome Admin, you are verified!",
    admin: req.admin,
  });
});

export default router;
