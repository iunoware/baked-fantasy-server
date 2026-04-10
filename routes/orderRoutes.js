import Order from "../models/order.js";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import Product from "../models/products.js";
import Course from "../models/course.js";
import express from "express";
import Essentials from "../models/essentials.js";

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

    if (!req.user) return res.status(401).json({ msg: "User not found" });

    next();
  } catch (error) {
    res.status(401).json({ msg: "unauthorized", error: error.message });
  }
};

// POST orders
// router.post("/orders", authMiddleware, async (req, res) => {
//   try {
//     const { products = [], shippingAddress, billingAddress } = req.body;

//     if (!Array.isArray(products) || products.length === 0) {
//       return res.status(400).json({ msg: "Products cannot be empty!" });
//     }

//     // Fetch product data from DB
//     const normalizedProducts = await Promise.all(
//       products.map(async (p) => {
//         let product = await Product.findById(p.productId);

//         if (!product) {
//           product = await Essentials.findById(p.productId);
//         }

//         if (!product) {
//           product = await Course.findById(p.productId);
//         }

//         if (!product) {
//           throw new Error("Product not found");
//         }

//         return {
//           productId: product._id,
//           title: product.title,
//           price: Number(product.discountedPrice),
//           productType: product.productType,
//           quantity: Number(p.quantity),
//         };
//       }),
//     );

//     // Calculate total price
//     const totalPrice = normalizedProducts.reduce(
//       (sum, p) => sum + p.price * p.quantity,
//       0,
//     );

//     // Create order
//     const newOrder = await Order.create({
//       user: {
//         userId: req.user._id,
//         name: req.user.name,
//         email: req.user.email,
//         phone: req.user.mobileNumber,
//       },

//       products: normalizedProducts,

//       shippingAddress,
//       billingAddress,

//       paymentStatus: "pending",
//       orderStatus: "confirmed",

//       totalPrice,
//     });

//     const courseProducts = normalizedProducts.filter((p) => p.productType === "Course");

//     if (courseProducts.length > 0) {
//       await User.findByIdAndUpdate(req.user._id, {
//         $addToSet: {
//           purchasedCourses: {
//             // $each: courseProducts.map((course) => ({
//             //   courseId: course.productId,
//             //   purchasedAt: new Date(),
//             // })),
//             $each: courseProducts.map((id) => ({
//               courseId: id,
//               purchasedAt: new Date(),
//             })),
//           },
//         },
//       });
//     }

//     res.json({
//       msg: "Order created successfully",
//       order: newOrder,
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// New POST orders
router.post("/orders", authMiddleware, async (req, res) => {
  try {
    const { products = [], shippingAddress, billingAddress } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ msg: "Products cannot be empty!" });
    }

    const normalizedProducts = await Promise.all(
      products.map(async (p) => {
        let product = await Product.findById(p.productId);

        if (!product) {
          product = await Essentials.findById(p.productId);
        }

        if (!product) {
          product = await Course.findById(p.productId);
        }

        if (!product) {
          throw new Error("Product not found");
        }

        return {
          productId: product._id,
          title: product.title,
          price: Number(product.discountedPrice),
          productType: product.productType,
          quantity: Number(p.quantity),
        };
      }),
    );

    const totalPrice = normalizedProducts.reduce(
      (sum, p) => sum + p.price * p.quantity,
      0,
    );

    const newOrder = await Order.create({
      user: {
        userId: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.mobileNumber,
      },
      products: normalizedProducts,
      shippingAddress,
      billingAddress,
      paymentStatus: "pending",
      orderStatus: "confirmed",
      totalPrice,
    });

    const courseProducts = normalizedProducts.filter((p) => p.productType === "Course");

    if (courseProducts.length > 0) {
      const user = await User.findById(req.user._id);

      const existingCourseIds = user.purchasedCourses.map((c) => c.courseId.toString());

      const newCourses = courseProducts.filter(
        (c) => !existingCourseIds.includes(c.productId.toString()),
      );

      if (newCourses.length > 0) {
        user.purchasedCourses.push(
          ...newCourses.map((course) => ({
            courseId: course.productId,
            purchasedAt: new Date(),
          })),
        );

        await user.save();
      }
    }

    res.status(201).json({
      msg: "Order created successfully",
      order: newOrder,
    });
  } catch (error) {
    res.status(500).json({
      msg: "Something went wrong",
      error: error.message,
    });
  }
});

// to GET all orders
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

// get today's revenue
router.get("/orders/todayRevenue", async (req, res) => {
  try {
    const today = new Date();

    const startOfDay = new Date(today);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const revenue = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
    ]);

    res.json({ revenue });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong", error: error.message });
  }
});

// get this week's revenue
router.get("/orders/thisWeekRevenue", async (req, res) => {
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

    const start = sevenDaysAgo;
    const end = endOfToday;

    const revenue = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
    ]);

    res.json({ revenue });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong", error: error.message });
  }
});

// get this month's revenue
router.get("/orders/thisMonthRevenue", async (req, res) => {
  try {
    const now = new Date();

    const startOfMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
    );

    const endOfMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999),
    );

    const revenue = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfMonth,
            $lte: endOfMonth,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
    ]);

    res.json({ revenue });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong", error: error.message });
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

// to get today's order in detail
router.get("/orders/todayDetail", async (req, res) => {
  try {
    const today = new Date();

    // const startOfDay = new Date(today.getUTCHours(0, 0, 0, 0));
    // const endOfDay = new Date(today.getUTCHours(23, 59, 59, 999));

    const startOfDay = new Date(today);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const orders = await Order.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    res.json({ orders });
    // console.log(orders);
  } catch (error) {
    res.status(500).json({ msg: "something went wrong", error: error.message });
  }
});

// to get the orders for today
router.get("/orders/today", async (req, res) => {
  try {
    const today = new Date();

    // const startOfDay = new Date(today.setUTCHours(0, 0, 0, 0));
    // const endOfDay = new Date(today.setUTCDate(23, 59, 59, 999));

    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setUTCHours(23, 59, 59, 999);

    const sales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        },
      },

      { $unwind: "$products" },

      {
        $group: {
          _id: "$products.productType",
          total: { $sum: "$products.quantity" },
        },
      },
    ]);

    const result = {
      essentialSales: 0,
      cakeSales: 0,
      courseSales: 0,
    };

    sales.forEach((item) => {
      if (item._id === "Essential") result.essentialSales = item.total;
      if (item._id === "Cake") result.cakeSales = item.total;
      if (item._id === "Course") result.courseSales = item.total;
    });

    const totalOrders = result.essentialSales + result.cakeSales + result.courseSales;

    res.status(200).json({
      ...result,
      totalOrders,
    });

    // res.status(200).json({ totalOrdersToday });
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

    const start = sevenDaysAgo;
    const end = endOfToday;

    const sales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },

      { $unwind: "$products" },

      {
        $group: {
          _id: "$products.productType",
          total: { $sum: "$products.quantity" },
        },
      },
    ]);

    const result = {
      essentialSales: 0,
      cakeSales: 0,
      courseSales: 0,
    };

    sales.forEach((item) => {
      if (item._id === "Essential") result.essentialSales = item.total;
      if (item._id === "Cake") result.cakeSales = item.total;
      if (item._id === "Course") result.courseSales = item.total;
    });

    const totalOrders = result.essentialSales + result.cakeSales + result.courseSales;

    res.json({
      ...result,
      totalOrders,
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
    // const [essentialSales, cakeSales, courseSales] = await Promise.all([
    //   Order.countDocuments({
    //     // productType: "essential",
    //     "products.productType": "Essential",
    //     createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    //   }),
    //   Order.countDocuments({
    //     // productType: "cake",
    //     "products.productType": "Cake",
    //     createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    //   }),
    //   Order.countDocuments({
    //     // productType: "course",
    //     "products.productType": "Course",
    //     createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    //   }),
    // ]);

    // res.status(200).json({
    //   essentialSales: essentialSales,
    //   cakeSales: cakeSales,
    //   courseSales: courseSales,
    //   totalOrders: totalOrders,
    // });

    const sales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },

      { $unwind: "$products" },

      {
        $group: {
          _id: "$products.productType",
          total: { $sum: "$products.quantity" },
        },
      },
    ]);

    const result = {
      essentialSales: 0,
      cakeSales: 0,
      courseSales: 0,
    };

    sales.forEach((item) => {
      if (item._id === "Essential") result.essentialSales = item.total;
      if (item._id === "Cake") result.cakeSales = item.total;
      if (item._id === "Course") result.courseSales = item.total;
    });

    const totalOrders = result.essentialSales + result.cakeSales + result.courseSales;

    res.json({
      ...result,
      totalOrders,
    });
  } catch (error) {
    res.status(500).json({ msg: "something went wrong", error: error.message });
  }
});

// overall sales
router.get("/orders/overall", async (req, res) => {
  try {
    // all these promise run in parallel
    // const [essentialSales, cakeSales, courseSales] = await Promise.all([
    //   Order.countDocuments({
    //     // productType: "essential",
    //     "products.productType": "Essential",
    //   }),
    //   Order.countDocuments({
    //     // productType: "cake",
    //     "products.productType": "Cake",
    //   }),
    //   Order.countDocuments({
    //     // productType: "course",
    //     "products.productType": "Course",
    //   }),
    // ]);

    // const totalOrders = essentialSales + cakeSales + courseSales;

    // res.status(200).json({
    //   essentialSales: essentialSales,
    //   cakeSales: cakeSales,
    //   courseSales: courseSales,
    //   totalOrders: totalOrders,
    // });

    const sales = await Order.aggregate([
      { $unwind: "$products" },

      {
        $group: {
          _id: "$products.productType",
          total: { $sum: "$products.quantity" },
        },
      },
    ]);

    const result = {
      essentialSales: 0,
      cakeSales: 0,
      courseSales: 0,
    };

    sales.forEach((item) => {
      if (item._id === "Essential") result.essentialSales = item.total;
      if (item._id === "Cake") result.cakeSales = item.total;
      if (item._id === "Course") result.courseSales = item.total;
    });

    const totalOrders = result.essentialSales + result.cakeSales + result.courseSales;

    res.json({
      ...result,
      totalOrders,
    });
  } catch (error) {
    res.status(500).json({ msg: "something went wrong", error: error.message });
  }
});

// to GET specific order
router.get("/orders/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(400).json({ msg: "can't find the specific order" });
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

// Get orders for the logged in user
router.get("/my-orders", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ "user.userId": req.user._id }).sort({
      createdAt: -1,
    });

    const essentialOrders = [];
    const cakeOrders = [];
    const courseOrders = [];

    // Split orders by product types to populate (based on the original code logic)
    orders.forEach((o) => {
      // Just check if any product inside has the designated type to populate it correctly
      // Though, orders can have mixed products... we'll just populate all based on the types present
      if (o.products.some((p) => p.productType === "Essential")) essentialOrders.push(o);
      if (o.products.some((p) => p.productType === "Cake" || !p.productType))
        cakeOrders.push(o);
      if (o.products.some((p) => p.productType === "Course")) courseOrders.push(o);
    });

    await Promise.all([
      Order.populate(essentialOrders, {
        path: "products.productId",
        model: "Essentials",
      }),
      // Default to Product model if no product type given just in case
      Order.populate(cakeOrders, {
        path: "products.productId",
        model: "Product",
      }),
      Order.populate(courseOrders, {
        path: "products.productId",
        model: "Course",
      }),
    ]);

    res.json(orders);
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong", error: error.message });
  }
});

export default router;
