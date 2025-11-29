const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: {
      type: String,
      enum: ["PERCENT", "FIXED", "FREE_SHIPPING"],
      required: true,
    },
    value: { type: Number, default: 0 }, // pour PERCENT ou FIXED
    freeShipping: { type: Boolean, default: false }, // ex: FREESHIP
    minAmount: { type: Number, default: 0 }, // montant minimum du panier
    isActive: { type: Boolean, default: true },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Coupon", couponSchema);
