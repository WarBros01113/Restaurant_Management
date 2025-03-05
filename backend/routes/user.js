import express from "express";
import User from "../models/User.js";

const router = express.Router();

// ✅ REGISTER: Create New Customer
router.post("/register", async (req, res) => {
  try {
    const { username, password, confirmPassword } = req.body;

    if (!username || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = new User({
      username,
      password, // 🔹 Storing plain text password
      role: "customer", // ✅ Customer role is set by default
    });

    await newUser.save();
    res.status(201).json({ message: "Customer registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ REGISTER: Create Staff (Waiter & Cook)
router.post("/register-staff", async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (role !== "waiter" && role !== "cook") {
      return res
        .status(400)
        .json({ message: "Invalid role. Use 'waiter' or 'cook'." });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = new User({
      username,
      password, // 🔹 Storing plain text password
      role, // ✅ Role is set dynamically (either waiter or cook)
    });

    await newUser.save();
    res.status(201).json({ message: `${role} registered successfully` });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ LOGIN: Authenticate Users (Customer, Waiter, Cook)
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (password !== user.password) {
      // 🔹 Direct password comparison
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.json({ message: "Login successful", role: user.role });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
