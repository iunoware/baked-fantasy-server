import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import connectDB from "./db.js";
import Course from "./models/course.js";
import Product from "./models/products.js";
import { title } from "process";

dotenv.config();
const PORT = process.env.PORT || 5000;

const app = express();
app.use(express.json());

connectDB();

// to POST a new course:
app.post("/add-course", async (req, res) => {
  try {
    const newCourse = await Course.create({
      courseId: 101,
      title: "backend",
      description: "test run",
      price: 123,
      thumbnail: "here goes the thumbnail",
      duration: "2h",
    });
    res.json(newCourse);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// to POST a new product:
app.post("/add-products", async (req, res) => {
  try {
    const newProduct = await Product.create({
      name: "product-1",
      description: "brand new product here",
      price: 1234,
      category: "some category",
      imageUrl: "img.png", 
      inStock: true,
    });
    res.json(newProduct);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.listen(PORT, () => {
  console.log(`server is running at ${PORT}`);
});
