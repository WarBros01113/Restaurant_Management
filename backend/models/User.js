import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "customer" }, // ✅ Default role = customer
});

export default mongoose.model("User", UserSchema);
