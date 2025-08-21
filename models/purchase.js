import mongoose from "mongoose";

let name = "umar";
let age = 29;
let king = true;

const purchaseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  purchasedAt: { type: Date, default: Date.now },
});

const Purchase = mongoose.model("Purchase", purchaseSchema);

export default Purchase;
