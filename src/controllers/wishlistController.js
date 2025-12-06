const User = require("../models/userModel");
const Product = require("../models/productModel");

// GET /wishlist/:userId
exports.getWishlist = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "userId manquant." });
    }

    const user = await User.findById(userId).populate(
      "wishlist",
      "name slug price promoPrice images stock"
    );

    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    return res.status(200).json(user.wishlist || []);
  } catch (err) {
    console.error("getWishlist error:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// POST /wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res
        .status(400)
        .json({ message: "userId et productId sont obligatoires." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: "Produit introuvable ou inactif." });
    }

    const already = user.wishlist.some(
      (pId) => pId.toString() === productId.toString()
    );
    if (already) {
      return res
        .status(200)
        .json({ message: "Produit déjà dans la wishlist.", wishlist: user.wishlist });
    }

    user.wishlist.push(productId);
    await user.save();

    return res
      .status(201)
      .json({ message: "Produit ajouté à la wishlist.", wishlist: user.wishlist });
  } catch (err) {
    console.error("addToWishlist error:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};


exports.removeFromWishlist = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res
        .status(400)
        .json({ message: "userId et productId sont obligatoires." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    user.wishlist = user.wishlist.filter(
      (pId) => pId.toString() !== productId.toString()
    );

    await user.save();

    return res
      .status(200)
      .json({ message: "Produit retiré de la wishlist.", wishlist: user.wishlist });
  } catch (err) {
    console.error("removeFromWishlist error:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};
// DELETE /wishlist/clear/:userId
exports.clearWishlist = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "userId manquant." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    user.wishlist = [];
    await user.save();

    return res
      .status(200)
      .json({ message: "Wishlist vidée.", wishlist: user.wishlist });
  } catch (err) {
    console.error("clearWishlist error:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

