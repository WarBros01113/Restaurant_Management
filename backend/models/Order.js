import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    tableNumber: { type: Number, required: true, index: true },
    orders: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: false }, // Add price field for each item
        status: {
          type: String,
          enum: ["pending", "Ready"],
          default: "pending",
        },
        total: { type: Number, default: 0 }, // Total price for this item (quantity * price)
      },
    ],
  },
  { timestamps: true } // Automatically adds createdAt & updatedAt fields
);

// Method to calculate the total bill for an order
orderSchema.methods.calculateTotalBill = function () {
  let total = 0;
  // Calculate the total price for each item (quantity * price)
  this.orders.forEach((item) => {
    item.total = item.quantity * item.price;
    total += item.total;
  });
  return total;
};

// Pre-save hook to update the total bill for the order before saving
orderSchema.pre("save", function (next) {
  const totalBill = this.calculateTotalBill();
  this.totalBill = totalBill; // Set the total bill on the order
  next();
});

export default mongoose.model("Order", orderSchema);
