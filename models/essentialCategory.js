import mongoose from "mongoose";

const essentialCategorySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique: true },
    subject: { type: String, required: true },
    imageUrl: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("EssentialCategory", essentialCategorySchema);
