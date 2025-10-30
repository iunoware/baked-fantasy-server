import express from "express";
import bcrypt from "bcryptjs";
import Admin from "../models/admin.js";

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
router.post("/admin/check", async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password)
      return res.status(400).json({ msg: "Name and password required" });
    const admin = await Admin.findOne({ name });
    if (!admin) {
      return res.status(404).json({ msg: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ msg: "Password incorrect" });
    }

    res.status(200).json({ msg: "Login successful", admin });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Create new admin (only by master admin)
router.post("/admin/newUser", async (req, res) => {
  try {
    const { masterName, masterPass, name, password } = req.body;

    // 1️⃣ Check required fields
    if (!masterName || !masterPass || !name || !password) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    // 2️⃣ Find master admin
    const masterAdmin = await Admin.findOne({ name: masterName });
    if (!masterAdmin || !masterAdmin.isMaster) {
      return res.status(403).json({ msg: "You are not authorized" });
    }

    // 3️⃣ Verify master admin password
    const isMasterMatch = await bcrypt.compare(
      masterPass,
      masterAdmin.password
    );
    if (!isMasterMatch) {
      return res.status(401).json({ msg: "Master password incorrect" });
    }

    // 4️⃣ Check if new admin already exists
    const userExists = await Admin.findOne({ name });
    if (userExists) {
      return res.status(400).json({ msg: "Admin already exists" });
    }

    // 5️⃣ Create new admin
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = await Admin.create({
      name,
      password: hashedPassword,
      isMaster: false, // normal admin
    });

    res.status(201).json({ msg: "New admin created successfully", newAdmin });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
