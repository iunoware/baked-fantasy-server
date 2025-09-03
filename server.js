// common imports
// import mongoose from "mongoose";
// import bodyParser from "body-parser";
import express from "express";
import dotenv from "dotenv";
import connectDB from "./db.js";
import cors from "cors";

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
import productRoutes from "./routes/productRoutes.js";

// other
// import { title } from "process";

dotenv.config();
const PORT = process.env.PORT || 5000;

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

// for authentication
app.use("/", authRoutes);
app.use("/", courseRoutes);
app.use("/", courseVideoRoutes);
app.use("/", orderRoutes);
app.use("/api", productRoutes);
app.use("/uploads", express.static("uploads"));

app.listen(PORT, () => {
  console.log(`server is running at ${PORT}`);
});
