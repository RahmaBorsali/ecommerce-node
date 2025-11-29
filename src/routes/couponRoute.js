const express = require("express");
const router = express.Router();
const couponController = require("../controllers/couponController");

// POST /coupons        -> créer un coupon (via Postman)
router.post("/", couponController.createCoupon);

// POST /coupons/validate -> valider un code promo depuis le front
router.post("/validate", couponController.validateCoupon);

module.exports = router;
