const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");

// Récupérer le panier d'un user
router.get("/user/:userId", cartController.getCartByUser);

// Ajouter un produit
router.post("/add", cartController.addItem);

// Mettre à jour quantité
router.put("/update", cartController.updateItemQuantity);

// Supprimer un produit du panier
router.delete("/remove", cartController.removeItem);

// Vider le panier
router.delete("/clear/:userId", cartController.clearCart);

module.exports = router;
