const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    label: { type: String, default: "Adresse" }, // ex: "Maison", "Travail"

    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, required: true, trim: true },
    phone:     { type: String, required: true, trim: true },

    line1:     { type: String, required: true, trim: true }, // rue, numéro
    line2:     { type: String, trim: true },                  // complément
    city:      { type: String, required: true, trim: true },
    postalCode:{ type: String, required: true, trim: true },
    country:   { type: String, required: true, trim: true, default: "Tunisie" },

    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Address", addressSchema);
