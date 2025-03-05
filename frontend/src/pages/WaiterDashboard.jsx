import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

const WaiterDashboard = () => {
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState({});
  const [tableNumber, setTableNumber] = useState("");

  // Fetch Menu
  const fetchMenu = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/menu");
      setMenu(res.data.length > 0 ? res.data : getDefaultMenu());
    } catch (err) {
      console.error("Error fetching menu", err);
      setMenu(getDefaultMenu());
    }
  }, []);

  // ✅ Fetch ALL Orders (including "Ready" ones)
  const fetchOrders = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/orders");
      const formattedOrders = res.data.reduce((acc, order) => {
        acc[order.tableNumber] = order.orders; // ✅ Keep all orders (not just pending)
        return acc;
      }, {});
      setOrders(formattedOrders);
    } catch (err) {
      console.error("Error fetching orders", err);
    }
  }, []);

  useEffect(() => {
    fetchMenu();
    fetchOrders();

    socket.on("orderUpdated", fetchOrders);
    return () => {
      socket.off("orderUpdated", fetchOrders);
    };
  }, [fetchMenu, fetchOrders]);

  const getDefaultMenu = () => [
    { _id: 1, name: "Pizza", availableQty: 10 },
    { _id: 2, name: "Burger", availableQty: 15 },
    { _id: 3, name: "French Fries", availableQty: 20 },
    { _id: 4, name: "Coke", availableQty: 30 },
  ];

  // Add to Queue
  const addToQueue = (item) => {
    if (!tableNumber) return alert("Enter a table number first!");
    if (item.availableQty <= 0) return alert(`${item.name} is out of stock!`);

    setOrders((prevOrders) => {
      const updatedOrders = { ...prevOrders };
      const tableOrders = [...(updatedOrders[tableNumber] || [])];

      const existingItemIndex = tableOrders.findIndex(
        (order) => order.name === item.name
      );

      if (existingItemIndex !== -1) {
        tableOrders[existingItemIndex] = {
          ...tableOrders[existingItemIndex],
          quantity: tableOrders[existingItemIndex].quantity + 1,
        };
      } else {
        tableOrders.push({
          name: item.name,
          quantity: 1,
          status: "pending",
        });
      }

      updatedOrders[tableNumber] = tableOrders;
      return updatedOrders;
    });

    setMenu((prevMenu) =>
      prevMenu.map((menuItem) =>
        menuItem._id === item._id
          ? {
              ...menuItem,
              availableQty: Math.max(0, menuItem.availableQty - 1),
            }
          : menuItem
      )
    );
  };

  // Send Order to Cook
  const sendOrderToCook = async () => {
    if (!tableNumber) {
      alert("Enter a table number first!");
      return;
    }

    const currentOrders = orders[tableNumber];

    if (!currentOrders || currentOrders.length === 0) {
      alert("No orders for this table!");
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/orders", {
        tableNumber,
        orders: currentOrders,
      });

      alert(`Order for Table ${tableNumber} sent to cook!`);
      socket.emit("orderUpdated");
      setOrders((prevOrders) => {
        const newOrders = { ...prevOrders };
        delete newOrders[tableNumber];
        return newOrders;
      });
      setTableNumber("");
    } catch (err) {
      console.error("Error sending order:", err);
      alert("Something went wrong! Please try again.");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Waiter Dashboard</h1>

      <input
        type="number"
        placeholder="Enter Table Number"
        value={tableNumber}
        onChange={(e) => setTableNumber(e.target.value)}
        className="border p-2 mb-4 w-full"
      />

      <h2 className="text-xl mb-2">Menu</h2>
      <table className="w-full border-collapse border border-gray-400 mb-6">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Item</th>
            <th className="border p-2">Available Qty</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {menu.map((item) => (
            <tr key={item._id} className="text-center">
              <td className="border p-2">{item.name}</td>
              <td className="border p-2">{item.availableQty}</td>
              <td className="border p-2">
                <button
                  className={`px-4 py-1 ${
                    item.availableQty === 0
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-500 text-white"
                  }`}
                  onClick={() => addToQueue(item)}
                  disabled={item.availableQty === 0}
                >
                  {item.availableQty === 0 ? "Out of Stock" : "Add to Queue"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-xl mb-2">Orders for Table {tableNumber}</h2>
      {orders[tableNumber] && orders[tableNumber].length > 0 ? (
        <table className="w-full border-collapse border border-gray-400">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Item</th>
              <th className="border p-2">Quantity</th>
              <th className="border p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders[tableNumber].map((order, index) => (
              <tr key={index} className="text-center">
                <td className="border p-2">{order.name}</td>
                <td className="border p-2">{order.quantity}</td>
                <td className="border p-2">
                  {order.status === "pending" ? (
                    "Pending"
                  ) : (
                    <span className="text-green-500">Ready</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No pending orders.</p>
      )}

      <button
        className="bg-green-500 text-white px-4 py-2 mt-4"
        onClick={sendOrderToCook}
      >
        Send Order
      </button>
    </div>
  );
};

export default WaiterDashboard;
