import mongoose from "mongoose";

const offlineCourseSchema = new mongoose.Schema({
  imageUrl: { required: true, type: String },
  title: { required: true, type: String },
  description: { required: true, type: String },
  highlights: { required: true, type: [String] },
  createdAt: { type: Date, default: Date.now },
});

const OfflineCourse = mongoose.model("OfflineCourse", offlineCourseSchema);

export default OfflineCourse;
