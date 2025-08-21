import Order from "../models/order.js";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import User from "../models/user.js";
import express from "express";

const router = express.Router();

// to store the token we need this code in frontend (in React)

// for login
// const res = await axios.post("/api/login", { email, password });
// localStorage.setItem("token", res.data.token);

// when clicking the buy now button
// axios.get("/api/orders", {
//   Headers: {
//     authorization: `Bearer ${localStorage.getItem("token")}`,
//   },
// });

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(400).json({ msg: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (error) {
    res.status(401).json("unauthorized", error.message);
  }
};

router.post("/orders", authMiddleware, (req, res) => {
  try {
    const { productId, quantity } = req.body;

    const newOrder = Order.create({
        userId: req.user._id,
        products: [{
            product
        }]
    });
  } catch (error) {
    res.status(400).json("server error", error.message);
  }
});

export default router;
