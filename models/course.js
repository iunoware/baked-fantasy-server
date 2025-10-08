import mongoose from "mongoose";

// for course's display card, we only need these:
const courseSchema = new mongoose.Schema({
  ImageUrl: { required: true, type: String },
  rating: { required: true, type: String },
  reviews: { required: true, type: String },
  // students: { required: true, type: String },
  title: { required: true, type: String },
  // subtitle: { required: true, type: String },
  description: { required: true, type: String },
  // duration: { required: true, type: String },
  totalHours: { required: true, type: String },
  totalVideos: { required: true, type: String },
  highlights: { required: true, type: [String] },
  price: { required: true, type: String },
  originalPrice: { required: true, type: String },
  createdAt: { type: Date, default: Date.now },
});

// title: { type: String, required: true },
// description: { type: String, required: true },
// price: { type: Number, required: true },
// thumbnail: { type: String, required: true },
// duration: { type: String, required: true },
// createdAt: { type: Date, default: Date.now },

const Course = mongoose.model("Course", courseSchema);

export default Course;
