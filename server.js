// common imports
// import mongoose from "mongoose";
// import bodyParser from "body-parser";
import express from "express";
import dotenv from "dotenv";
import connectDB from "./db.js";
import cors from "cors";
import jwt from "jsonwebtoken";
import User from "./models/user.js";
import path from "path";
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// for the models
// import Course from "./models/course.js";
// import Product from "./models/products.js";
// import User from "./models/user.js";
// import Order from "./models/order.js";

// for the routes
import authRoutes from "./routes/authRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import courseVideoRoutes from "./routes/courseVideoRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import productCategoryRoutes from "./routes/productCategoryRoutes.js";
import essentialCategoryRoutes from "./routes/essentialCategoryRoute.js";
import productRoutes from "./routes/productRoutes.js";
import essentialsRoutes from "./routes/essentialsRoutes.js";
import myLearning from "./routes/myLearning.js";
import cartRoutes from "./routes/cartRoutes.js";
import offlineCourseRoute from "./routes/offlineCourseRoute.js";
import bannerRoute from "./routes/bannerRoute.js";
import adminRoute from "./routes/adminRoute.js";

dotenv.config();
const PORT = process.env.PORT || 5000;

const app = express();
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

// Register all routes
app.use("/", authRoutes);
app.use("/", courseRoutes);
app.use("/", courseVideoRoutes);
app.use("/", orderRoutes);
app.use("/", productCategoryRoutes);
app.use("/", essentialCategoryRoutes);
app.use("/", productRoutes);
app.use("/", essentialsRoutes);
app.use("/", myLearning);
app.use("/", bannerRoute);
app.use("/", adminRoute);
app.use("/", offlineCourseRoute);
app.use("/", cartRoutes);

app.use("/uploads", express.static("uploads"));
// app.use("/", userVerification);

async function verifyUser(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ msg: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(403).json({ msg: "User not found" });

    req.user = user;
    next();
  } catch (error) {
    res.status(400).json({ msg: "Invalid token", error: error.message });
  }
}

app.get("/uploads/:fileName", verifyUser, (req, res) => {
  const fileName = req.params.fileName;
  const options = {
    root: path.join(process.cwd(), "uploads"),
  };
  res.sendFile(fileName, options, (err) => {
    if (err) {
      console.error(err);
      res.status(404).send("File not found");
    }
  });
});

app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`server is running at ${PORT}`);
});
