const Cart = require("../models/cartModel");
const Product = require("../models/productModel");

// 🧾 Récupérer le panier d'un user
exports.getCartByUser = async (req, res) => {
  try {
    const { userId } = req.params; // /cart/user/:userId

    let cart = await Cart.findOne({ user: userId }).populate(
      "items.product",
      "name price promoPrice images slug"
    );

    if (!cart) {
      return res.status(200).json({ user: userId, items: [] });
    }

    return res.status(200).json(cart);
  } catch (err) {
    console.error("getCartByUser error:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// ➕ Ajouter un produit au panier
exports.addItem = async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ message: "userId et productId sont obligatoires." });
    }

    const qty = quantity && quantity > 0 ? quantity : 1;

    // vérifier que le produit existe
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: "Produit introuvable." });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      // créer un panier pour ce user
      cart = await Cart.create({
        user: userId,
        items: [{ product: productId, quantity: qty }],
      });
      return res.status(201).json(cart);
    }

    // panier existe : voir si le produit est déjà dedans
    const index = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (index > -1) {
      cart.items[index].quantity += qty;
    } else {
      cart.items.push({ product: productId, quantity: qty });
    }

    await cart.save();
    const populated = await cart.populate("items.product", "name price promoPrice images slug");

    return res.status(200).json(populated);
  } catch (err) {
    console.error("addItem error:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// 🔁 Mettre à jour la quantité d'un produit
exports.updateItemQuantity = async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    if (!userId || !productId || quantity == null) {
      return res
        .status(400)
        .json({ message: "userId, productId et quantity sont obligatoires." });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: "Panier introuvable." });
    }

    const index = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (index === -1) {
      return res.status(404).json({ message: "Produit introuvable dans le panier." });
    }

    if (quantity <= 0) {
      // si qty <= 0 -> on supprime l'item
      cart.items.splice(index, 1);
    } else {
      cart.items[index].quantity = quantity;
    }

    await cart.save();
    const populated = await cart.populate("items.product", "name price promoPrice images slug");

    return res.status(200).json(populated);
  } catch (err) {
    console.error("updateItemQuantity error:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// ❌ Supprimer un produit du panier
exports.removeItem = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ message: "userId et productId sont obligatoires." });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: "Panier introuvable." });
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    await cart.save();
    const populated = await cart.populate("items.product", "name price promoPrice images slug");

    return res.status(200).json(populated);
  } catch (err) {
    console.error("removeItem error:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// 🧹 Vider entièrement le panier
exports.clearCart = async (req, res) => {
  try {
    const { userId } = req.params;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(200).json({ message: "Panier déjà vide." });
    }

    cart.items = [];
    await cart.save();

    return res.status(200).json({ message: "Panier vidé." });
  } catch (err) {
    console.error("clearCart error:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};
