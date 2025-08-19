// import express from "express";
import mongoose from "mongoose";
// import dotenv from "dotenv";

const courseSchema = new mongoose.Schema({
  courseId: { type: Number, required: true, unique: true },
  title: { type: String, required: true, unique: true },
  description: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  thumbnail: { type: String, required: true, unique: true },
  duration: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Course = mongoose.model("Course", courseSchema);

export default Course;
