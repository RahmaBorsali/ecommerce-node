const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

// POST /orders
router.post("/", orderController.createOrder);

// Récupérer les commandes d'un user
router.get("/user/:userId", orderController.getOrdersByUser);

// Récupérer toutes les commandes (admin)
router.get("/", orderController.getAllOrders);

// Mettre à jour le statut d'une commande
router.patch("/:id/status", orderController.updateOrderStatus);
module.exports = router;
