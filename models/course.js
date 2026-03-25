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
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    ratingSum: { type: Number, default: 0 },
    totalStudents: { type: Number, default: 0 },
    sections: [sectionSchema],
  },
  {
    timestamps: true,
  },
);

const Course = mongoose.model("Course", courseSchema);
export default Course;
