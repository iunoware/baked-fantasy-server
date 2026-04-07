import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
  },
  { timestamps: true },
);

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
    discountedPrice: { type: Number, required: true },
    originalPrice: { type: Number, required: true },
    language: { type: String, default: "Tamil" },
    duration: { type: String, required: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    ratingSum: { type: Number, default: 0 },
    totalStudents: { type: Number, default: 0 },
    productType: { type: String, enum: ["Course"], default: "Course" },
    reviews: [reviewSchema], // 👈 add this line at the end, before sections or after, doesn't matter
    sections: [sectionSchema],
  },
  {
    timestamps: true,
  },
);

const Course = mongoose.model("Course", courseSchema);
export default Course;
