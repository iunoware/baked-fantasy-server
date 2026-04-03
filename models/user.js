import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
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
});

const User = mongoose.model("User", userSchema);
export default User;
