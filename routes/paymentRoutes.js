import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Debug logs to verify initialization and environment variable loading
console.log("=== Razorpay Initialization Debug ===");
console.log(
  "KEY_ID Status:",
  process.env.RAZORPAY_KEY_ID
    ? "Loaded (Length: " + process.env.RAZORPAY_KEY_ID.length + ")"
    : "UNDEFINED",
);
console.log(
  "KEY_SECRET Status:",
  process.env.RAZORPAY_KEY_SECRET
    ? "Loaded (Length: " + process.env.RAZORPAY_KEY_SECRET.length + ")"
    : "UNDEFINED",
);
console.log("=====================================");

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      // Razorpay sends this automatically when payment succeeds
      const signature = req.headers["x-razorpay-signature"];
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

      // Verify it's really from Razorpay
      const hmac = crypto.createHmac("sha256", webhookSecret);
      hmac.update(req.body.toString());
      const generatedSignature = hmac.digest("hex");

      if (generatedSignature === signature) {
        const event = JSON.parse(req.body.toString());

        // This runs even if user closed browser!
        if (event.event === "payment.captured") {
          const payment = event.payload.payment.entity;

          // SAVE TO DATABASE - guaranteed to run
          await savePaymentToDatabase({
            orderId: payment.order_id,
            paymentId: payment.id,
            amount: payment.amount / 100,
            status: "captured",
            method: payment.method,
            email: payment.email,
            contact: payment.contact,
            timestamp: new Date(payment.created_at * 1000),
          });

          // Send confirmation email
          await sendConfirmationEmail(payment.email, payment.order_id);

          console.log(`✅ Webhook: Payment ${payment.id} saved to DB`);
        }

        if (event.event === "payment.failed") {
          const payment = event.payload.payment.entity;

          // Track failed payments
          await logFailedPayment({
            orderId: payment.order_id,
            reason: payment.error_description,
          });

          console.log(
            `❌ Webhook: Payment failed - ${payment.error_description}`,
          );
        }

        res.json({ status: "ok" });
      } else {
        res.status(400).json({ error: "Invalid signature" });
      }
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  },
);

// Global instance removed to avoid env load order issues
router.post("/create-order", async (req, res) => {
  try {
    const { amount, currency, receipt } = req.body;

    if (!amount || amount < 100) {
      return res
        .status(400)
        .json({ error: "Amount must be at least 100 paise" });
    }

    const key_id = process.env.RAZORPAY_KEY_ID?.trim();
    const key_secret = process.env.RAZORPAY_KEY_SECRET?.trim();

    if (!key_id || !key_secret) {
      console.error(
        "CRITICAL ERROR: Razorpay keys are missing in environment variables.",
      );
      return res.status(500).json({
        error:
          "Server Configuration Error: Payment gateway credentials not configured.",
      });
    }

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    const options = {
      amount,
      currency: currency || "INR",
      receipt: receipt || `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("=== Razorpay Order Creation Error ===");
    console.error("Status Code:", error.statusCode);
    console.error(
      "Error Description:",
      error.error?.description || error.message,
    );
    console.error("Full Error Object:", JSON.stringify(error, null, 2));
    console.error("Request Body Received:", req.body);
    console.error("=====================================");

    if (error.statusCode === 401) {
      return res.status(401).json({
        error:
          "Authentication failed. Please check backend Razorpay credentials.",
      });
    } else if (error.statusCode === 400) {
      return res.status(400).json({
        error: error.error?.description || "Razorpay API Error: Bad Request",
      });
    }

    res
      .status(500)
      .json({ error: "Failed to create order. Internal server error." });
  }
});

router.post("/verify-payment", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET?.trim();
    if (!key_secret) {
      console.error(
        "CRITICAL ERROR: Razorpay secret is missing during verification.",
      );
      return res.status(500).json({ error: "Server Configuration Error" });
    }

    const hmac = crypto.createHmac("sha256", key_secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature === razorpay_signature) {
      await db.payments.create({
        order_id: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        status: "success",
        amount: req.body.amount,
        timestamp: new Date(),
      });
      console.log(`✅ Payment verified: ${razorpay_payment_id}`);
      res.json({ success: true, message: "Payment verified successfully" });
    } else {
      console.log(`❌ Payment verification failed: Invalid signature`);
      res.status(400).json({ error: "Invalid signature" });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ error: "Payment verification failed" });
  }
});

export default router;
