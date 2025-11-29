const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true },

    description: { type: String, trim: true },

    price: { type: Number, required: true, min: 0 },
    promoPrice: { type: Number, min: 0 }, // optionnel

    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },

    images: [{ type: String }], // URLs ou chemins vers tes images
    stock: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },

    tags: [{ type: String }],
    isFeatured: { type: Boolean, default: false }, // produit mis en avant
    averageRating: { type: Number, default: 0 }, // moyenne 0–5
    reviewsCount: { type: Number, default: 0 }, // nombre d’avis
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
