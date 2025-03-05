import express from "express";
import Order from "../models/Order.js";
import Menu from "../models/Menu.js"; // Import Menu model to fetch prices
import { io } from "../server.js"; // Import socket instance

const router = express.Router();

// Place or Update Order for a Table (Fixes duplicate issue)
router.post("/", async (req, res) => {
  const { tableNumber, orders } = req.body;

  if (!tableNumber || !orders || orders.length === 0) {
    return res.status(400).json({ message: "Invalid order data" });
  }

  try {
    // Fetch item prices from the Menu collection and attach to the order
    for (let order of orders) {
      const menuItem = await Menu.findOne({ name: order.name });
      if (menuItem) {
        order.price = menuItem.price; // Add price from menu to order item
      } else {
        return res
          .status(400)
          .json({ message: `Menu item ${order.name} not found` });
      }
    }

    // Check if an order already exists for the table
    let existingOrder = await Order.findOne({ tableNumber });

    if (existingOrder) {
      existingOrder.orders = orders; // Replace the old order with the new one
      await existingOrder.save();
    } else {
      const newOrder = new Order({ tableNumber, orders });
      await newOrder.save();
    }

    io.emit("orderUpdated"); // Notify all clients
    res.status(201).json({ message: "Order updated successfully" });
  } catch (error) {
    console.error("Error saving order:", error);
    res
      .status(500)
      .json({ message: "Error saving order", error: error.message });
  }
});

// Update order when cook marks an item as ready
router.put("/update", async (req, res) => {
  const { orderId, itemName } = req.body;

  if (!orderId || !itemName) {
    return res.status(400).json({ message: "Missing orderId or itemName" });
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const item = order.orders.find((i) => i.name === itemName);
    if (!item)
      return res.status(400).json({ message: "Item not found in order" });

    if (item.quantity > 0) {
      item.quantity -= 1; // Decrease the quantity
      if (item.quantity === 0) {
        item.status = "Ready"; // Mark item as ready
      }
      await order.save(); // Save the order back to the database

      // Check if all items are marked as ready
      const allItemsReady = order.orders.every((i) => i.status === "Ready");

      if (allItemsReady) {
        // If all items are ready, delete the order from the database (mark as complete)
        await Order.deleteOne({ _id: orderId });

        // Emit the event to notify customer and cook about the order completion
        io.emit("orderCompleted", order.tableNumber); // Notify the customer the bill is ready
      }

      io.emit("orderUpdated"); // Notify other clients (waiters, cooks)
      return res.json({ message: `${itemName} marked as ready`, order });
    } else {
      return res.status(400).json({ message: "Item already marked as ready" });
    }
  } catch (error) {
    console.error("Error updating order:", error);
    res
      .status(500)
      .json({ message: "Error updating order", error: error.message });
  }
});

// Get all orders (Admin view or for debugging)
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res
      .status(500)
      .json({ message: "Error fetching orders", error: error.message });
  }
});

// Get Bill for a specific table
router.get("/bill/:tableNumber", async (req, res) => {
  const { tableNumber } = req.params;

  try {
    const order = await Order.findOne({ tableNumber });

    if (!order) {
      return res
        .status(404)
        .json({ message: "No orders found for this table" });
    }

    // Filter out items with zero quantity or items that are ready
    const filteredItems = order.orders.filter(
      (item) => item.quantity > 0 && item.status !== "Ready"
    );

    // Calculate total for the order
    const bill = {
      tableNumber,
      items: filteredItems.map((item) => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity, // Total cost for the item
      })),
      total: filteredItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ), // Total bill
    };

    res.json({ bill });
  } catch (error) {
    console.error("Error fetching bill:", error);
    res
      .status(500)
      .json({ message: "Error fetching the bill", error: error.message });
  }
});

export default router;
