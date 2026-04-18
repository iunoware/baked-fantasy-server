import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    mobileNumber: { type: Number, default: null },
    role: { type: String }, //new code
    address: { type: String, default: "" },
    provider: {
      type: String,
      default: "local",
    },
    purchasedCourses: [
      {
        courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
        purchasedAt: { type: Date, default: Date.now },
        // price: { type: String, ref: "Course" },
      },
    ],

    createdAt: { type: Date, default: Date.now },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userSchema.virtual("addresses", {
  ref: "Address",
  localField: "_id",
  foreignField: "userId",
});

userSchema.virtual("orders", {
  ref: "Order",
  localField: "_id",
  foreignField: "user.userId",
});

const User = mongoose.model("User", userSchema);
export default User;
