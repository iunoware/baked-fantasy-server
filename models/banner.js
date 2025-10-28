import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  image: { type: String, required: true },
  active: { type: Boolean, required: true, default: true },
  // startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

const Banner = mongoose.model("Banner", bannerSchema);
export default Banner;
