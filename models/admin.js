import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  password: { type: String, required: true },
  // status: { type: Boolean, required: true },
  isMaster: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;
