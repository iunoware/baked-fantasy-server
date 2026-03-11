// import mongoose from "mongoose";

// const orderSchema = new mongoose.Schema(
//   {
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },

//     name: {
//       type: String,
//       required: true,
//     },

//     productType: {
//       type: String,
//       enum: ["essential", "cake", "course"],
//       required: true,
//     },

//     products: [
//       {
//         productId: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "Product",
//           required: true,
//         },
//         productName: {
//           type: String,
//           ref: "Product",
//           required: true,
//         },
//         quantity: {
//           type: Number,
//           required: true,
//         },
//         price: {
//           type: Number,
//           required: true,
//         },
//       },
//     ],

//     shippingAddress: {
//       name: String,
//       phone: String,
//       address: String,
//       city: String,
//       pincode: String,
//       locationNote: String,
//     },

//     billingAddress: {
//       type: String,
//     },

//     paymentStatus: {
//       type: String,
//       enum: ["pending", "paid", "failed"],
//       default: "pending",
//     },

// orderStatus: {
//   type: String,
//   enum: [
//     "confirmed",
//     "preparing",
//     "packed",
//     "out_for_delivery",
//     "delivered",
//     "cancelled",
//   ],
//   default: "confirmed",
// },

//     deliveryPartner: {
//       name: String,
//       phone: String,
//       vehicle: String,
//     },

//     pricing: {
//       itemsTotal: Number,
//       deliveryFee: Number,
//       totalAmount: Number,
//     },

//     estimatedDeliveryTime: String,

//     deliveredAt: Date,
//   },
//   { timestamps: true },
// );

// const Order = mongoose.model("Order", orderSchema);

// export default Order;

import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        // required: true,
      },
      name: String,
      email: String,
      phone: String,
    },

    products: [
      {
        productId: mongoose.Schema.Types.ObjectId,
        title: {
          type: String,
          required: true,
        },

        price: {
          type: Number,
          required: true,
        },

        productType: {
          type: String,
          enum: ["Essential", "Cake", "Course"],
          required: true,
        },

        quantity: {
          type: Number,
          required: true,
        },
      },
    ],

    shippingAddress: {
      name: String,
      phone: String,
      address: String,
      city: String,
      pincode: String,
    },

    billingAddress: String,

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    orderStatus: {
      type: String,
      enum: [
        "confirmed",
        "preparing",
        "packed",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      default: "confirmed",
    },

    totalPrice: Number,
  },
  { timestamps: true },
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
