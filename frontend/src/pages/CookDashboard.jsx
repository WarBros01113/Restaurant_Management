import { useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";

// Socket connection
const socket = io("http://localhost:5000");

const CookDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false); // Add loading state for fetching orders

  // Fetch orders when the component mounts
  useEffect(() => {
    fetchOrders();

    // Listen for updates to orders from the server
    const handleOrderUpdate = () => {
      fetchOrders(); // Refresh orders when the waiter updates an order
    };

    socket.on("orderUpdated", handleOrderUpdate);
    socket.on("orderCompleted", handleOrderCompleted); // Listen for order completed events

    return () => {
      // Clean up when the component unmounts
      socket.off("orderUpdated", handleOrderUpdate);
      socket.off("orderCompleted", handleOrderCompleted);
    };
  }, []);

  // Fetch orders from the backend
  const fetchOrders = async () => {
    setLoading(true); // Show loading state while fetching orders
    try {
      const res = await axios.get("http://localhost:5000/api/orders");
      setOrders(res.data); // Set the fetched orders to the state
    } catch (err) {
      console.error("Error fetching orders", err);
    } finally {
      setLoading(false); // Hide loading state after fetching
    }
  };

  // Handle order completion when the order is ready
  const handleOrderCompleted = (tableNumber) => {
    // Filter out the completed order from the list
    setOrders((prevOrders) =>
      prevOrders.filter((order) => order.tableNumber !== tableNumber)
    );
  };

  // Mark an item as ready and notify the waiter
  const markItemReady = async (orderId, itemName, tableNumber) => {
    try {
      await axios.put("http://localhost:5000/api/orders/update", {
        orderId,
        itemName,
      });

      // Fetch the updated orders
      fetchOrders();

      // Check if all items in the order are marked as ready
      const updatedOrder = await axios.get(
        `http://localhost:5000/api/orders/${orderId}`
      );
      const allItemsReady = updatedOrder.data.orders.every(
        (item) => item.status === "Ready"
      );

      // If all items are ready, delete the order and notify the customer
      if (allItemsReady) {
        await axios.delete(`http://localhost:5000/api/orders/${orderId}`); // Delete order from database
        socket.emit("orderCompleted", tableNumber); // Notify customer that the bill is ready
      }
    } catch (err) {
      console.error("Error updating order status", err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Cook Dashboard</h1>

      {/* Loading state */}
      {loading ? (
        <p>Loading orders...</p>
      ) : orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        orders.map((order) => (
          <div key={order._id} className="border p-4 mb-4">
            <h2 className="text-xl font-bold">Table {order.tableNumber}</h2>

            {/* Loop through each item in the order */}
            {order.orders.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <span>
                  {item.name} x {item.quantity}
                </span>

                {/* Button to mark item as ready */}
                {item.status !== "Ready" && (
                  <button
                    className="bg-green-500 text-white px-4 py-1"
                    onClick={() =>
                      markItemReady(order._id, item.name, order.tableNumber)
                    }
                  >
                    Mark Ready
                  </button>
                )}
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
};

export default CookDashboard;
