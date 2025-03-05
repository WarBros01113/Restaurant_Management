import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import menuRoutes from "./routes/menu.js";
import orderRoutes from "./routes/orders.js";
import userRoutes from "./routes/user.js";
import Order from "./models/Order.js"; // Assuming you have an Order model

dotenv.config();

// ✅ Initialize Express App
const app = express();
const server = createServer(app); // ✅ HTTP Server for Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*", // Adjust for production URL
    methods: ["GET", "POST"],
  },
});

// ✅ Middleware
app.use(express.json()); // For parsing JSON requests
app.use(cors()); // Enable cross-origin requests

// ✅ API Routes
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/user", userRoutes);

// ✅ Debug: Log Available Routes
console.log("✅ Registered Routes:");
["/api/menu", "/api/orders", "/api/user"].forEach((route) =>
  console.log(route)
);

// ✅ Handle Undefined Routes (404)
app.use((req, res) => {
  console.warn(`⚠️ 404 Not Found: ${req.originalUrl}`);
  res.status(404).json({ message: "API route not found" });
});

// ✅ Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res
    .status(500)
    .json({ message: "Internal Server Error", error: err.message });
});

// ✅ Socket.IO Setup for Real-Time Updates
io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);

  // Listen for 'orderUpdated' from clients and broadcast it to all
  socket.on("orderUpdated", async (tableNumber) => {
    console.log(
      "🔔 Order update event received from client for table:",
      tableNumber
    );

    try {
      // Find the order for the table
      const order = await Order.findOne({ tableNumber });

      if (!order) {
        console.warn("⚠️ Order not found for table:", tableNumber);
        return;
      }

      // Check if all items are marked as ready and notify the customers
      const allItemsReady = order.orders.every(
        (item) => item.status === "Ready"
      );

      if (allItemsReady) {
        // Emit event when all items are ready
        io.emit("orderCompleted", tableNumber); // Notify the customer side to refresh the bill
      } else {
        // Emit event for partial updates
        io.emit("orderUpdated", tableNumber); // Notify client of partial updates
      }
    } catch (error) {
      console.error("❌ Error handling order update:", error);
    }
  });

  // Listen for client disconnection
  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// ✅ Start Server Only After Database Connection
connectDB()
  .then(() => {
    console.log("✅ Database connected successfully");
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err);
    process.exit(1); // Stop the app if DB connection fails
  });

// ✅ Export io for use in other files
export { io };
