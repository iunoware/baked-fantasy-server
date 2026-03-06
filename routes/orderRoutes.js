import Order from "../models/order.js";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import express from "express";

const router = express.Router();

/* 
// to store the token we need this code in frontend (in React)

// for login
const res = await axios.post("/login", { email, password });
localStorage.setItem("token", res.data.token);



// when clicking the buy now button, to get the product id from front-end
<button onClick={() => handleClick(product._id, product.price, quantity)}> Buy now </button>



// for sending the order id when clicking the edit order
<button onClick={() => handleClick(order._id)}> edit order </button>

const handleEdit = async (orderId) => {
  try {
    const response = await axios.patch(`/orders/${orderId}`, {
      orderStatus: "shipped",
      shippingAddress: "New Address",
      billingAddress: "New Billing Address",
      paymentStatus: "paid"
    });

    console.log(response.data);
  } catch (error) {
    console.error("Error updating order:", error);
  }
};



// to set the authorization
axios.get("/orders", {
  products: [
    productId: product._id,
    quantity: quantity,
    price: product.price,
  ],
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});
*/

// middleware for orders
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

// to POST an order
router.post("/orders", authMiddleware, async (req, res) => {
  console.log(req.body);
  try {
    if (!req.body) return res.status(400).json({ msg: "req.body is missing!" });

    const {
      // name,
      products = [],
      productType,
      shippingAddress,
      billingAddress,
    } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ msg: "products cna't be an empty array!" });
    }

    const normalized = products.map((p) => ({
      productId: p.productId,
      quantity: p.quantity,
      price: p.price,
    }));

    let totalPrice = normalized.reduce(
      (sum, p) => sum + p.quantity * p.price,
      0,
    );

    const newOrder = await Order.create({
      userId: req.user._id,
      products: normalized,
      name: req.user.name,
      totalPrice,
      productType,
      shippingAddress,
      billingAddress,
    });
    res.json("success", newOrder);
  } catch (error) {
    res.status(400).json(error.message);
  }
});

//to GET all orders
router.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find();
    if (!orders) return res.status(400).json({ msg: "can't find orders" });

    // Grouping and populating based on productType
    const essentialOrders = orders.filter((o) => o.productType === "essential");
    const cakeOrders = orders.filter((o) => o.productType === "cake");
    const courseOrders = orders.filter((o) => o.productType === "course");

    await Promise.all([
      Order.populate(essentialOrders, {
        path: "products.productId",
        model: "Essentials",
      }),
      Order.populate(cakeOrders, {
        path: "products.productId",
        model: "Product",
      }),
      Order.populate(courseOrders, {
        path: "products.productId",
        model: "Course",
      }),
    ]);

    res.json({ length: orders.length, orders });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// get the total revenue
router.get("/orders/revenue", async (req, res) => {
  try {
    const revenue = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
    ]);

    res.json({
      totalRevenue: revenue[0]?.totalRevenue || 0,
    });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong", error: error.message });
  }
});

// to get the orders for today
router.get("/orders/today", async (req, res) => {
  try {
    const today = new Date();

    const startOfDay = new Date(today.setUTCHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setUTCDate(23, 59, 59, 999));

    // const totalOrdersToday = await Order.countDocuments({
    //   createdAt: { $gte: startOfDay, $lte: endOfDay },
    // });

    const [essentialSales, cakeSales, courseSales] = await Promise.all([
      Order.countDocuments({
        productType: "essential",
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      }),
      Order.countDocuments({
        productType: "cake",
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      }),
      Order.countDocuments({
        productType: "course",
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      }),
    ]);

    const totalOrders = essentialSales + cakeSales + courseSales;

    res.status(200).json({
      essentialSales: essentialSales,
      cakeSales: cakeSales,
      courseSales: courseSales,
      totalOrders: totalOrders,
    });

    // console.log("orders today: ", totalOrdersToday);

    res.status(200).json({ totalOrdersToday });
  } catch (error) {
    res.status(500).json({ msg: "something went wrong", error: error.message });
  }
});

// to get the orders for today
router.get("/orders/thisWeek", async (req, res) => {
  try {
    const today = new Date();

    const startOfDay = new Date(today.setUTCHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setUTCDate(23, 59, 59, 999));

    // const totalOrdersToday = await Order.countDocuments({
    //   createdAt: { $gte: startOfDay, $lte: endOfDay },
    // });

    const [essentialSales, cakeSales, courseSales] = await Promise.all([
      Order.countDocuments({
        productType: "essential",
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      }),
      Order.countDocuments({
        productType: "cake",
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      }),
      Order.countDocuments({
        productType: "course",
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      }),
    ]);

    const totalOrders = essentialSales + cakeSales + courseSales;

    res.status(200).json({
      essentialSales: essentialSales,
      cakeSales: cakeSales,
      courseSales: courseSales,
      totalOrders: totalOrders,
    });

    // console.log("orders today: ", totalOrdersToday);

    res.status(200).json({ totalOrdersToday });
  } catch (error) {
    res.status(500).json({ msg: "something went wrong", error: error.message });
  }
});

// sales for the week
router.get("/orders/thisWeek", async (req, res) => {
  try {
    const now = new Date();

    const day = now.getUTCDay();

    const sevenDaysAgo = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() - day, // includes today
        0,
        0,
        0,
        0,
      ),
    );

    const endOfToday = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );
    // all these promise run in parallel
    const [essentialSales, cakeSales, courseSales] = await Promise.all([
      Order.countDocuments({
        productType: "essential",
        createdAt: { $gte: sevenDaysAgo, $lte: endOfToday },
      }),
      Order.countDocuments({
        productType: "cake",
        createdAt: { $gte: sevenDaysAgo, $lte: endOfToday },
      }),
      Order.countDocuments({
        productType: "course",
        createdAt: { $gte: sevenDaysAgo, $lte: endOfToday },
      }),
    ]);

    const totalOrders = essentialSales + cakeSales + courseSales;

    res.status(200).json({
      essentialSales: essentialSales,
      cakeSales: cakeSales,
      courseSales: courseSales,
      totalOrders: totalOrders,
    });
  } catch (error) {
    res.status(500).json({ msg: "something went wrong", error: error.message });
  }
});

// sales for the current month
router.get("/orders/thisMonth", async (req, res) => {
  try {
    const now = new Date();

    const startOfMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
    );

    const endOfMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999),
    );

    // all these promise run in parallel
    const [essentialSales, cakeSales, courseSales] = await Promise.all([
      Order.countDocuments({
        productType: "essential",
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      }),
      Order.countDocuments({
        productType: "cake",
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      }),
      Order.countDocuments({
        productType: "course",
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      }),
    ]);

    const totalOrders = essentialSales + cakeSales + courseSales;

    res.status(200).json({
      essentialSales: essentialSales,
      cakeSales: cakeSales,
      courseSales: courseSales,
      totalOrders: totalOrders,
    });
  } catch (error) {
    res.status(500).json({ msg: "something went wrong", error: error.message });
  }
});

// overall sales
router.get("/orders/overall", async (req, res) => {
  try {
    // all these promise run in parallel
    const [essentialSales, cakeSales, courseSales] = await Promise.all([
      Order.countDocuments({
        productType: "essential",
      }),
      Order.countDocuments({
        productType: "cake",
      }),
      Order.countDocuments({
        productType: "course",
      }),
    ]);

    const totalOrders = essentialSales + cakeSales + courseSales;

    res.status(200).json({
      essentialSales: essentialSales,
      cakeSales: cakeSales,
      courseSales: courseSales,
      totalOrders: totalOrders,
    });
  } catch (error) {
    res.status(500).json({ msg: "something went wrong", error: error.message });
  }
});

//to GET specific order
router.get("/orders/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order)
      return res.status(400).json({ msg: "can't find the specific order" });
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// to PATCH a an order
router.patch("/orders/:id", async (req, res) => {
  try {
    const {
      orderStatus,
      shippingAddress,
      billingAddress,
      paymentStatus,
      deliveryPartner,
    } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(400).json({ msg: "order not found" });

    if (orderStatus) order.orderStatus = orderStatus;
    if (shippingAddress) order.shippingAddress = shippingAddress;
    if (billingAddress) order.billingAddress = billingAddress;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (deliveryPartner) order.deliveryPartner = deliveryPartner;

    await order.save();

    res.json({ msg: "order updated successfully" });
  } catch (error) {
    res.status(400).json({ msg: "something went wrong", error: error.message });
  }
});

export default router;
