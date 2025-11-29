const Review = require("../models/reviewModel");
const Product = require("../models/productModel");
const User = require("../models/userModel");

/**
 * Recalcule la moyenne et le nombre d'avis d'un produit
 */
async function recomputeProductRating(productId) {
  const stats = await Review.aggregate([
    { $match: { product: new (require("mongoose").Types.ObjectId)(productId) } },
    {
      $group: {
        _id: "$product",
        avgRating: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  if (stats.length === 0) {
    await Product.findByIdAndUpdate(productId, {
      averageRating: 0,
      reviewsCount: 0,
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      averageRating: stats[0].avgRating,
      reviewsCount: stats[0].count,
    });
  }
}

// POST /reviews
// body: { productId, userId (optionnel), rating, comment }
exports.createReview = async (req, res) => {
  try {
    const { productId, userId, rating, comment } = req.body;

    if (!productId || !rating) {
      return res
        .status(400)
        .json({ message: "productId et rating sont obligatoires." });
    }

    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "La note doit être entre 1 et 5." });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res
        .status(404)
        .json({ message: "Produit introuvable ou inactif." });
    }

    let user = null;
    if (userId) {
      user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur introuvable." });
      }
    }

    // Option: empêcher plusieurs avis par le même user pour le même produit
    let review;
    if (userId) {
      review = await Review.findOne({ product: productId, user: userId });
    }

    if (review) {
      // mise à jour de l'avis existant
      review.rating = rating;
      review.comment = comment;
      await review.save();
    } else {
      // création d'un nouvel avis
      review = await Review.create({
        product: productId,
        user: userId || null,
        rating,
        comment,
      });
    }

    // Recalculer la moyenne
    await recomputeProductRating(productId);

    return res.status(201).json(review);
  } catch (err) {
    console.error("createReview error:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// GET /reviews/product/:productId
exports.getReviewsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ product: productId })
      .populate("user", "firstName lastName email")
      .sort({ createdAt: -1 });

    return res.status(200).json(reviews);
  } catch (err) {
    console.error("getReviewsByProduct error:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// DELETE /reviews/:id
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: "Avis introuvable." });
    }

    const productId = review.product.toString();

    await review.deleteOne();

    // Recalculer la moyenne du produit
    await recomputeProductRating(productId);

    return res.status(200).json({ message: "Avis supprimé." });
  } catch (err) {
    console.error("deleteReview error:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};
