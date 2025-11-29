const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const Coupon = require("../models/couponModel");

const BASE_SHIPPING = 8;
const FREE_SHIPPING_THRESHOLD = 8000;

exports.createOrder = async (req, res) => {
  try {
    const {
      userId,           
      items,            
      couponCode,
      shippingAddress,
      paymentMethod,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Le panier est vide." });
    }

    if (!paymentMethod) {
      return res.status(400).json({ message: "Méthode de paiement obligatoire." });
    }

    // 1) Récupérer les produits et recalculer les montants
    const productIds = items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds }, isActive: true });

    const orderItems = [];
    let subtotal = 0;

    for (const cartItem of items) {
      const prod = products.find((p) => p._id.toString() === cartItem.productId);
      if (!prod) {
        return res.status(400).json({ message: "Produit introuvable dans le panier." });
      }

      const qty = cartItem.quantity || 1;
      const unitPrice = prod.promoPrice ?? prod.price;

      orderItems.push({
        product: prod._id,
        name: prod.name,
        price: unitPrice,
        quantity: qty,
      });

      subtotal += unitPrice * qty;
    }

    // 2) Livraison
    let shippingCost = BASE_SHIPPING;
    if (subtotal >= FREE_SHIPPING_THRESHOLD) {
      shippingCost = 0;
    }

    // 3) Coupon
    let discount = 0;
    let appliedCouponCode = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
      });

      if (coupon) {
        // minAmount
        if (!coupon.minAmount || subtotal >= coupon.minAmount) {
          if (coupon.type === "PERCENT") {
            discount = (subtotal * coupon.value) / 100;
          } else if (coupon.type === "FIXED") {
            discount = coupon.value;
          }
          if (coupon.type === "FREE_SHIPPING" || coupon.freeShipping) {
            shippingCost = 0;
          }
          appliedCouponCode = coupon.code;
        }
      }
    }

    const total = subtotal + shippingCost - discount;

    // 4) Créer la commande
    const order = await Order.create({
      user: userId || null,
      items: orderItems,
      subtotal,
      shippingCost,
      discount,
      total,
      couponCode: appliedCouponCode,
      shippingAddress,
      paymentMethod,
      paymentStatus: "PAID", // pour l'instant on simule un succès
      status: "NEW",
    });

    return res.status(201).json(order);
  } catch (err) {
    console.error("createOrder error:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};
exports.getOrdersByUser = async (req, res) => {
  try {
    const userId = req.params.userId; // /orders/user/:userId

    if (!userId) {
      return res.status(400).json({ message: "userId manquant." });
    }

    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 });

    return res.status(200).json(orders);
  } catch (err) {
    console.error("getOrdersByUser error:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// 2) Toutes les commandes (pour admin)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "firstName lastName email")
      .sort({ createdAt: -1 });

    return res.status(200).json(orders);
  } catch (err) {
    console.error("getAllOrders error:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// 3) Mise à jour du statut d'une commande
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;           // /orders/:id/status
    const { status, paymentStatus } = req.body;

    if (!status && !paymentStatus) {
      return res
        .status(400)
        .json({ message: "status ou paymentStatus obligatoire." });
    }

    const update = {};
    if (status) update.status = status;
    if (paymentStatus) update.paymentStatus = paymentStatus;

    const order = await Order.findByIdAndUpdate(id, update, {
      new: true,
    });

    if (!order) {
      return res.status(404).json({ message: "Commande introuvable." });
    }

    return res.status(200).json(order);
  } catch (err) {
    console.error("updateOrderStatus error:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};
