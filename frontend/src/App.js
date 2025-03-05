import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import WaiterDashboard from "./pages/WaiterDashboard";
import CookDashboard from "./pages/CookDashboard";
import CustomerDashboard from "./pages/CustomerDashboard"; // Import CustomerDashboard

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />{" "}
        {/* Ensure /login route is defined */}
        <Route path="/register" element={<Register />} />
        <Route path="/waiter-dashboard" element={<WaiterDashboard />} />
        <Route path="/cook-dashboard" element={<CookDashboard />} />
        <Route
          path="/customer-dashboard"
          element={<CustomerDashboard />}
        />{" "}
        {/* Add CustomerDashboard route */}
      </Routes>
    </Router>
  );
}

export default App;
