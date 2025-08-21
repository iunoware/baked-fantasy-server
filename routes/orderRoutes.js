import Order from "../models/order.js";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import express from "express";

const router = express.Router();

// to store the token we need this code in frontend (in React)

// for login
// const res = await axios.post("/api/login", { email, password });
// localStorage.setItem("token", res.data.token);

// when clicking the buy now button, to get the product id from front-end
// <button onClick={() => handleClick(product._id, product.price, quantity)} Buy now </button>
//
// axios.get("/api/orders", {
//   products: [
//     productId: product._id,
//     quantity: quantity,
//     price: product.price,
//   ],
//   headers: {
//     Authorization: `Bearer ${localStorage.getItem("token")}`,
//   },
// });

// middle ware or orders
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(400).json({ msg: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (error) {
    res.status(401).json({ msg: "unauthorized", error: error.message });
  }
};

// stores the data in the DB
router.post("/orders", authMiddleware, async (req, res) => {
  try {
    const { products, shippingAddress, billingAddress } = req.body;

    const { productId, quantity, price } = products;

    const newOrder = await Order.create({
      userId: req.user._id,
      products: [
        {
          productId,
          quantity,
          price,
        },
      ],
      totalPrice: quantity * price,
      // paymentStatus: "pending",
      // orderStatus: "ok",
      shippingAddress,
      billingAddress,
    });
    res.json("success", newOrder);
  } catch (error) {
    res.status(400).json(error.message);
  }
});

export default router;
