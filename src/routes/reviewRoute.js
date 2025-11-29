const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");

// Créer / mettre à jour un avis
router.post("/", reviewController.createReview);

// Récupérer les avis d’un produit
router.get("/product/:productId", reviewController.getReviewsByProduct);

// Supprimer un avis
router.delete("/:id", reviewController.deleteReview);

module.exports = router;
