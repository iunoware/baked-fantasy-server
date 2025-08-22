import mongoose from "mongoose";

// for course's display card, we only need these:
const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  thumbnail: { type: String, required: true },
  duration: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Course = mongoose.model("Course", courseSchema);

export default Course;
