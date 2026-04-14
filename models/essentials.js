import mongoose from "mongoose";

const equipmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique: true },
    // title: { type: String, required: true },
    originalPrice: { type: Number, required: true },
    discountedPrice: { type: Number, required: true },
    subject: { type: String },
    description: { type: String },
    info: { type: String },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EssentialCategory",
      required: true,
    },
    images: [{ type: String }],
    inStock: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    productType: { type: String, enum: ["Essential"], default: "Essential" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const Essentials = mongoose.model("Essentials", equipmentSchema);
export default Essentials;
