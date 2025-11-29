const express = require("express");
const router = express.Router();
const wishlistController = require("../controllers/wishlistController");

// Récupérer la wishlist d'un user
router.get("/:userId", wishlistController.getWishlist);

// Ajouter un produit à la wishlist
router.post("/", wishlistController.addToWishlist);

// Retirer un produit de la wishlist
router.delete("/", wishlistController.removeFromWishlist);

module.exports = router;
