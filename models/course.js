import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  courseId: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  thumbnail: { type: String, required: true },
  duration: { type: String, required: true },
  videos: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

const Course = mongoose.model("Course", courseSchema);

export default Course;
