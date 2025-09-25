import mongoose from "mongoose";
import Course from "../models/course.js";

// after buying the course, these are the small videos:
const courseVideoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  thumbnail: { type: String, required: true },
  videoUrl: { type: String, required: true },
  section: { type: String, required: true },
  duration: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: Course, required: true },
  serialNum: { type: Number, required: true, unique: true },
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const CourseVideo = mongoose.model("CourseVideo", courseVideoSchema);

export default CourseVideo;
