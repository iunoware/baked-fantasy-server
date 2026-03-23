import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    label: {
      type: String,
      enum: ["Home", "Work", "Others"],
      default: "Home",
    },
    fullAddress: {
      type: String,
      required: true,
    },
    landmark: {
      type: String,
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Address", addressSchema);
