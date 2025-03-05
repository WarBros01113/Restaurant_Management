import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { io } from "socket.io-client";

// Socket connection
const socket = io("http://localhost:5000");

const CustomerDashboard = () => {
  const [tableNumber, setTableNumber] = useState("");
  const [bill, setBill] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false); // Loading state

  // Handle table number change
  const handleTableNumberChange = (e) => {
    setTableNumber(e.target.value);
  };

  // Fetch bill function with the correct logic
  const fetchBill = useCallback(async () => {
    if (!tableNumber) {
      setMessage("Please enter a valid table number.");
      return;
    }

    setLoading(true); // Start loading

    try {
      const res = await axios.get(
        `http://localhost:5000/api/orders/bill/${tableNumber}`
      );
      if (res.data && res.data.bill) {
        // Do not filter out any items, include all
        setBill(res.data.bill);
        setMessage("");
      } else {
        setMessage("No orders found for this table.");
        setBill(null); // Reset the bill if no orders found
      }
    } catch (error) {
      console.error("Error fetching bill:", error);
      setMessage("Error fetching the bill.");
      setBill(null); // Reset the bill on error
    } finally {
      setLoading(false); // Stop loading
    }
  }, [tableNumber]); // Now fetchBill depends on tableNumber

  // Fetch the bill whenever the order is completed for this table
  useEffect(() => {
    if (!tableNumber) return; // Skip if no table number is provided

    // Listen for the order completion event only when tableNumber is set
    const handleOrderCompleted = (completedTableNumber) => {
      // Check if the completed table number matches the customer's table number
      if (completedTableNumber === tableNumber) {
        fetchBill(); // Re-fetch the bill when the order is completed
      }
    };

    // Listen to the event from socket server
    socket.on("orderCompleted", handleOrderCompleted);

    // Cleanup when component is unmounted or table number changes
    return () => {
      socket.off("orderCompleted", handleOrderCompleted);
    };
  }, [tableNumber, fetchBill]); // Add fetchBill to the dependency array

  return (
    <div className="p-6 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Customer Dashboard</h1>

      {/* Table Number Input */}
      <input
        type="text"
        placeholder="Enter Table Number"
        value={tableNumber}
        onChange={handleTableNumberChange}
        className="border p-2 mb-4 w-64"
      />

      <button
        onClick={fetchBill}
        className="bg-blue-500 text-white px-4 py-2"
        disabled={loading} // Disable button while loading
      >
        {loading ? "Fetching Bill..." : "Get Bill"}
      </button>

      {/* Error/Success Message */}
      {message && <p className="mt-4 text-red-500">{message}</p>}

      {/* Bill Details */}
      {bill && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold">
            Bill for Table {tableNumber}
          </h2>
          <ul className="space-y-2 mt-4">
            {bill.items.map((item, index) => (
              <li key={index} className="flex justify-between">
                <span>
                  {item.name} ({item.quantity})
                  {item.status === "Ready" && " - Ready"} {/* Status display */}
                </span>
                <span>${item.price * item.quantity}</span>{" "}
                {/* Total cost per item */}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between font-bold">
            <span>Total:</span>
            <span>${bill.total}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
