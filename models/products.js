import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    subject: { type: String },
    description: { type: String },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category", // reference to Category collection
      required: true,
    },
    images: [{ type: String }], // store multiple images
    inStock: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
export default Product;
