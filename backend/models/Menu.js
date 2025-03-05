import mongoose from "mongoose";

const MenuSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  availableQty: { type: Number, required: true },
  price: { type: Number, required: false }, // Add price field here
});

export default mongoose.model("Menu", MenuSchema);
