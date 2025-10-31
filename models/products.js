import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique: true },
    originalPrice: { type: Number, required: true },
    discountedPrice: { type: Number, required: true },
    subject: { type: String },
    description: { type: String },
    info: { type: String },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    images: [{ type: String }],
    isActive: { type: Boolean, default: true },
    inStock: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
export default Product;
