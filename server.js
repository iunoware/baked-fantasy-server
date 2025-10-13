// common imports
// import mongoose from "mongoose";
// import bodyParser from "body-parser";
import express from "express";
import dotenv from "dotenv";
import connectDB from "./db.js";
import cors from "cors";
// import path from "path";
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
// import userVerification from "./routes/userVerification.js";

// other
// import { title } from "process";

dotenv.config();
const PORT = process.env.PORT || 5000;

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// for authentication
app.use("/", authRoutes);
app.use("/", courseRoutes);
app.use("/", courseVideoRoutes);
app.use("/", orderRoutes);
app.use("/", productCategoryRoutes);
app.use("/", essentialCategoryRoutes);
app.use("/", productRoutes);
app.use("/", essentialsRoutes);
app.use("/", myLearning);
// app.use("/", userVerification);
app.use("/uploads", express.static("uploads"));

app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`server is running at ${PORT}`);
});
