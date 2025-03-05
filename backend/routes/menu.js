import express from "express";
import Menu from "../models/Menu.js"; // Assuming Menu model is in models/Menu.js

const router = express.Router();

// Route to fetch all menu items
router.get("/", async (req, res) => {
  try {
    const menuItems = await Menu.find();
    res.json(menuItems);
  } catch (error) {
    console.error("Error fetching menu items:", error);
    res
      .status(500)
      .json({ message: "Error fetching menu items", error: error.message });
  }
});

export default router;
