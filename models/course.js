// import mongoose from "mongoose";

// // for course's display card, we only need these:
// const courseSchema = new mongoose.Schema({
//   ImageUrl: { required: true, type: String },
//   rating: { required: true, type: String },
//   reviews: { required: true, type: String },
//   // students: { required: true, type: String },
//   title: { required: true, type: String },
//   // subtitle: { required: true, type: String },
//   description: { required: true, type: String },
//   // duration: { required: true, type: String },
//   totalHours: { required: true, type: String },
//   totalVideos: { required: true, type: String },
//   highlights: { required: true, type: [String] },
//   discountedPrice: { required: true, type: Number },
//   originalPrice: { required: true, type: Number },
//   productType: { required: true, type: String, enum: ["Course"], default: "Course" },
//   createdAt: { type: Date, default: Date.now },
// });

// // title: { type: String, required: true },
// // description: { type: String, required: true },
// // price: { type: Number, required: true },
// // thumbnail: { type: String, required: true },
// // duration: { type: String, required: true },
// // createdAt: { type: Date, default: Date.now },

// const Course = mongoose.model("Course", courseSchema);

// export default Course;

import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  videoUrl: { type: String, required: true },
  pdfUrl: { type: String, default: null },
  duration: { type: String },
  order: { type: Number, required: true },
});

const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  order: { type: Number, required: true },
  lessons: [lessonSchema],
});

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    thumbnail: { type: String, required: true },
    price: { type: Number, required: true },
    crossedPrice: { type: Number, required: true },
    language: { type: String, default: "Tamil" },
    duration: { type: String, required: true },
    rating: { type: String, default: 0 },
    totalStudents: { type: String, default: 0 },
    sections: [sectionSchema],
  },
  {
    timestamps: true,
  },
);

const Course = mongoose.model("Course", courseSchema);
export default Course;
