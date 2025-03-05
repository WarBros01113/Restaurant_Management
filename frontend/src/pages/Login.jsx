import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const login = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/user/login", {
        username,
        password, // 🔹 Sending plain text password
      });

      console.log("Server Response:", res.data);

      localStorage.setItem("userRole", res.data.role);

      if (res.data.role === "waiter") {
        navigate("/waiter-dashboard");
      } else if (res.data.role === "cook") {
        navigate("/cook-dashboard");
      } else if (res.data.role === "customer") {
        navigate("/customer-dashboard");
      } else {
        setError("Unauthorized role");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid Credentials");
      console.error("Login Error:", err);
    }
  };

  return (
    <div className="p-6 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="border p-2 mb-2 w-64"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 mb-2 w-64"
      />
      <button className="bg-blue-500 text-white px-4 py-2" onClick={login}>
        Login
      </button>
    </div>
  );
};

export default Login;
