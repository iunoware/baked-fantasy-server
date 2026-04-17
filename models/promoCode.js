import mongoose from "mongoose";

const promoCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      upperCase: true,
      trim: true,
      minLength: 6,
      maxLength: 8,
      match: [/^[A-Z0-9]+$/, "Code must only contain letters and numbers"],
    },
    discount: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("PromoCode", promoCodeSchema);
