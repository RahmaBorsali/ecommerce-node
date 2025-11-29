const Coupon = require("../models/couponModel");

const FREE_SHIPPING_THRESHOLD = 8000; // pour la validation si tu l'utilises déjà

// ========== CRÉATION D’UN COUPON (pour Postman) ==========
exports.createCoupon = async (req, res) => {
  try {
    const { code, type, value, freeShipping, minAmount, isActive } = req.body;

    if (!code || !type) {
      return res
        .status(400)
        .json({ message: "code et type sont obligatoires." });
    }

    const exists = await Coupon.findOne({ code: code.toUpperCase() });
    if (exists) {
      return res.status(400).json({ message: "Ce code existe déjà." });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      type,
      value: value ?? 0,
      freeShipping: !!freeShipping,
      minAmount: minAmount ?? 0,
      isActive: typeof isActive === "boolean" ? isActive : true,
    });

    return res.status(201).json(coupon);
  } catch (err) {
    console.error("createCoupon error:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// ========== VALIDATION D’UN COUPON ==========
exports.validateCoupon = async (req, res) => {
  try {
    const { code, subtotal } = req.body;

    if (!code || typeof subtotal !== "number") {
      return res
        .status(400)
        .json({ message: "Code promo et montant du panier sont obligatoires." });
    }

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });
    if (!coupon) {
      return res.status(404).json({ message: "Code promo invalide ou expiré." });
    }

    const now = new Date();
    if (coupon.startDate && coupon.startDate > now) {
      return res.status(400).json({ message: "Ce code n'est pas encore actif." });
    }
    if (coupon.endDate && coupon.endDate < now) {
      return res.status(400).json({ message: "Ce code est expiré." });
    }

    if (subtotal < coupon.minAmount) {
      return res.status(400).json({
        message: `Montant minimum pour ce code : ${coupon.minAmount} DT.`,
      });
    }

    let discount = 0;
    let freeShipping = false;

    if (coupon.type === "PERCENT") {
      discount = (subtotal * coupon.value) / 100;
    } else if (coupon.type === "FIXED") {
      discount = coupon.value;
    }

    if (coupon.type === "FREE_SHIPPING" || coupon.freeShipping) {
      freeShipping = true;
    }

    if (subtotal >= FREE_SHIPPING_THRESHOLD) {
      freeShipping = true;
    }

    return res.status(200).json({
      valid: true,
      code: coupon.code,
      discount,
      freeShipping,
      message: "Code promo appliqué.",
    });
  } catch (err) {
    console.error("validateCoupon error:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};
