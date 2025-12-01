const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },        // nom au moment de l’achat
    price: { type: Number, required: true },       // prix au moment de l’achat
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    address: String,
    city: String,
    postalCode: String,
    phone: String,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // null si invité
    items: [orderItemSchema],

    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shippingCost: { type: Number, default: 0 },
    total: { type: Number, required: true },

    couponCode: { type: String },
    shippingAddress: addressSchema,

    paymentMethod: { type: String, enum: ["CARD", "PAYPAL", "APPLEPAY", "GOOGLEPAY"], required: true },
    paymentStatus: { type: String, enum: ["PENDING", "PAID", "FAILED"], default: "PAID" },

    status: {
      type: String,
      enum: ["NEW", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"],
      default: "NEW",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
