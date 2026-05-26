import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import Order from "../models/order.js";

dotenv.config();

const router = express.Router();

// Debug logs
console.log("=== Razorpay Initialization Debug ===");
console.log("KEY_ID:", process.env.RAZORPAY_KEY_ID ? " Loaded" : " MISSING");
console.log(
  "KEY_SECRET:",
  process.env.RAZORPAY_KEY_SECRET ? " Loaded" : " MISSING",
);
console.log(
  "WEBHOOK_SECRET:",
  process.env.RAZORPAY_WEBHOOK_SECRET ? " Loaded" : " MISSING",
);
console.log("=====================================");

// 1. CREATE ORDER
router.post("/create-order", async (req, res) => {
  try {
    const {
      amount,
      currency,
      receipt,
      user,
      products,
      shippingAddress,
      paymentMethod,
    } = req.body;

    // Validation
    if (!amount || amount < 100) {
      return res.status(400).json({
        error: "Amount must be at least ₹1 (100 paise)",
      });
    }

    const key_id = process.env.RAZORPAY_KEY_ID?.trim();
    const key_secret = process.env.RAZORPAY_KEY_SECRET?.trim();

    if (!key_id || !key_secret) {
      console.error("CRITICAL: Razorpay credentials missing!");
      return res.status(500).json({
        error: "Payment gateway not configured",
      });
    }

    const razorpay = new Razorpay({ key_id, key_secret });

    // Create Razorpay order
    const options = {
      amount,
      currency: currency || "INR",
      receipt: receipt || `receipt_${Date.now()}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    const order = new Order({
      user: user,
      products: products,
      shippingAddress: shippingAddress,
      razorpayOrderId: razorpayOrder.id,
      paymentMethod: paymentMethod,
      paymentStatus: "pending",
      orderStatus: "pending",
      totalPrice: amount / 100, // Convert paise to rupees
    });

    await order.save();
    console.log(` Order created in DB: ${order._id}`);
    console.log(` Razorpay order created: ${razorpayOrder.id}`);

    res.json({
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      mongoOrderId: order._id, // Return MongoDB ID to frontend
    });
  } catch (error) {
    console.error("=== Order Creation Error ===");
    console.error("Error:", error);
    console.error("============================");

    if (error.statusCode === 401) {
      return res.status(401).json({ error: "Invalid Razorpay credentials" });
    }

    res.status(500).json({ error: "Failed to create order" });
  }
});

// 2. VERIFY PAYMENT (Frontend calls this)
router.post("/verify-payment", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    // Validation
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing payment details" });
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET?.trim();
    if (!key_secret) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    // Verify signature
    const hmac = crypto.createHmac("sha256", key_secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature === razorpay_signature) {
      const updatedOrder = await Order.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        {
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          paymentStatus: "paid",
          orderStatus: "confirmed",
        },
        { new: true }, // Return updated document
      );

      if (!updatedOrder) {
        return res.status(404).json({ error: "Order not found" });
      }

      console.log(` Payment verified & saved: ${razorpay_payment_id}`);
      console.log(` Order updated: ${updatedOrder._id}`);

      res.json({
        success: true,
        message: "Payment verified successfully",
        orderId: updatedOrder._id,
      });
    } else {
      // Invalid signature - mark as failed
      await Order.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { paymentStatus: "failed" },
      );

      console.log(` Invalid signature for order: ${razorpay_order_id}`);
      res.status(400).json({ error: "Invalid payment signature" });
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ error: "Payment verification failed" });
  }
});

// 3. WEBHOOK (Razorpay calls this)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const signature = req.headers["x-razorpay-signature"];
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

      if (!webhookSecret) {
        console.error("CRITICAL: Webhook secret not configured!");
        return res.status(500).json({ error: "Webhook not configured" });
      }

      // Verify webhook signature
      const hmac = crypto.createHmac("sha256", webhookSecret);
      hmac.update(req.body);
      const generatedSignature = hmac.digest("hex");

      if (generatedSignature !== signature) {
        console.warn("⚠️ Invalid webhook signature");
        return res.status(400).json({ error: "Invalid signature" });
      }

      // Parse event
      const event = JSON.parse(req.body.toString());
      console.log(`📨 Webhook received: ${event.event}`);

      // Handle payment captured event
      if (event.event === "payment.captured") {
        const payment = event.payload.payment.entity;

        // Update order in database
        const updatedOrder = await Order.findOneAndUpdate(
          { razorpayOrderId: payment.order_id },
          {
            razorpayPaymentId: payment.id,
            paymentStatus: "paid",
            orderStatus: "confirmed",
          },
          { new: true },
        );

        if (updatedOrder) {
          console.log(` Webhook: Order ${updatedOrder._id} marked as paid`);

          // Optional: Send confirmation email here
          // await sendConfirmationEmail(updatedOrder.user.email, updatedOrder._id);
        } else {
          console.warn(`⚠️ Webhook: Order not found for ${payment.order_id}`);
        }
      }

      // Handle payment failed event
      if (event.event === "payment.failed") {
        const payment = event.payload.payment.entity;

        await Order.findOneAndUpdate(
          { razorpayOrderId: payment.order_id },
          { paymentStatus: "failed" },
        );

        console.log(` Webhook: Payment failed for ${payment.order_id}`);
      }

      res.json({ status: "ok" });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  },
);

router.get("/order-status/:orderId", async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({
      orderId: order._id,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      totalPrice: order.totalPrice,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

export default router;
