const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const auth = require("../middlewares/auth");

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Gestion des commandes (création, consultation, changement de statut)
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   schemas:
 *     OrderItem:
 *       type: object
 *       description: Ligne d'une commande, calculée côté serveur à partir des produits du panier
 *       properties:
 *         product:
 *           type: string
 *           description: ID du produit (ObjectId)
 *           example: "6650f1e923c8f1b7b232a1cd"
 *         name:
 *           type: string
 *           description: Nom du produit au moment de la commande
 *           example: "iPhone 15 Pro"
 *         price:
 *           type: number
 *           description: Prix unitaire utilisé pour la commande (promoPrice ou price)
 *           example: 1199
 *         quantity:
 *           type: integer
 *           description: Quantité commandée
 *           example: 2
 *
 *     ShippingAddress:
 *       type: object
 *       description: Adresse de livraison fournie par le client
 *       properties:
 *         firstName:
 *           type: string
 *           example: "Rahma"
 *         lastName:
 *           type: string
 *           example: "Borsali"
 *         address:
 *           type: string
 *           example: "12 Rue de la Liberté"
 *         city:
 *           type: string
 *           example: "Tunis"
 *         postalCode:
 *           type: string
 *           example: "1002"
 *         phone:
 *           type: string
 *           example: "+21612345678"
 *
 *     Order:
 *       type: object
 *       description: Commande enregistrée en base
 *       properties:
 *         _id:
 *           type: string
 *           example: "6765b3ad3a0b944e1fb1d2a0"
 *         user:
 *           type: string
 *           nullable: true
 *           description: ID de l'utilisateur ayant passé la commande (peut être null pour un invité si prévu)
 *           example: "692b04d8c6576cd3df408260"
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         subtotal:
 *           type: number
 *           description: Total des lignes (sans remise ni livraison)
 *           example: 2398
 *         shippingCost:
 *           type: number
 *           description: Frais de livraison calculés côté serveur (par défaut 8, 0 au-delà d’un certain montant ou avec coupon)
 *           example: 8
 *         discount:
 *           type: number
 *           description: Remise totale appliquée via coupon
 *           example: 200
 *         total:
 *           type: number
 *           description: Montant final payé (subtotal + shippingCost - discount)
 *           example: 2206
 *         couponCode:
 *           type: string
 *           nullable: true
 *           description: Code coupon effectivement appliqué
 *           example: "SALE10"
 *         shippingAddress:
 *           $ref: '#/components/schemas/ShippingAddress'
 *         paymentMethod:
 *           type: string
 *           enum: [CARD, PAYPAL, APPLEPAY, GOOGLEPAY]
 *           description: Méthode de paiement choisie par le client
 *           example: "CARD"
 *         paymentStatus:
 *           type: string
 *           enum: [PENDING, PAID, FAILED]
 *           description: Statut du paiement (actuellement fixé à PAID dans le contrôleur)
 *           example: "PAID"
 *         status:
 *           type: string
 *           enum: [NEW, PROCESSING, SHIPPED, DELIVERED, CANCELLED]
 *           description: Statut logistique de la commande
 *           example: "NEW"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-12-05T14:23:11.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-12-05T14:24:03.000Z"
 *
 *     OrderItemInput:
 *       type: object
 *       description: Ligne de panier envoyée par le front pour créer la commande
 *       properties:
 *         productId:
 *           type: string
 *           description: ID du produit dans MongoDB
 *           example: "6650f1e923c8f1b7b232a1cd"
 *         quantity:
 *           type: integer
 *           description: Quantité souhaitée
 *           example: 2
 *
 *     CreateOrderRequest:
 *       type: object
 *       required:
 *         - items
 *         - shippingAddress
 *         - paymentMethod
 *       properties:
 *         userId:
 *           type: string
 *           nullable: true
 *           description: >
 *             ID de l'utilisateur connecté.  
 *             Le backend l'utilise pour lier la commande à un compte. Peut être null si la logique invité le permet.
 *           example: "692b04d8c6576cd3df408260"
 *         items:
 *           type: array
 *           description: Lignes du panier. Le backend recalculera les prix à partir des produits actifs.
 *           items:
 *             $ref: '#/components/schemas/OrderItemInput'
 *         couponCode:
 *           type: string
 *           nullable: true
 *           description: Code promotionnel à appliquer (si trouvé, actif et éligible).
 *           example: "SALE10"
 *         shippingAddress:
 *           $ref: '#/components/schemas/ShippingAddress'
 *         paymentMethod:
 *           type: string
 *           enum: [CARD, PAYPAL, APPLEPAY, GOOGLEPAY]
 *           example: "CARD"
 *
 *     UpdateOrderStatusRequest:
 *       type: object
 *       description: >
 *         Objet pour mettre à jour le statut logistique et/ou le statut de paiement.  
 *         Au moins un des deux champs est obligatoire.
 *       properties:
 *         status:
 *           type: string
 *           enum: [NEW, PROCESSING, SHIPPED, DELIVERED, CANCELLED]
 *           example: "CANCELLED"
 *         paymentStatus:
 *           type: string
 *           enum: [PENDING, PAID, FAILED]
 *           example: "PAID"
 */

// 🔐 toutes les routes /orders nécessitent un JWT valide
router.use(auth);

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Créer une commande
 *     description: |
 *       Crée une nouvelle commande à partir du panier côté front.
 *
 *       **Règles métier principales :**
 *       - `items` ne doit pas être vide (sinon 400 "Le panier est vide.")
 *       - `paymentMethod` est obligatoire
 *       - Les prix sont recalculés côté serveur à partir des produits actifs :
 *         - si `promoPrice` existe → utilisé comme prix
 *         - sinon → `price`
 *       - Frais de livraison (`shippingCost`) calculés avec des constantes serveur :
 *         - `BASE_SHIPPING = 8`
 *         - `FREE_SHIPPING_THRESHOLD = 8000` (livraison gratuite au-dessus)
 *       - Si `couponCode` est fourni et correspond à un coupon actif :
 *         - type `PERCENT` → remise en % sur le `subtotal`
 *         - type `FIXED` → remise fixe
 *         - type `FREE_SHIPPING` ou `freeShipping = true` → livraison gratuite
 *       - Le total est calculé **server-side** : `total = subtotal + shippingCost - discount`
 *       - Le champ `paymentStatus` est actuellement forcé à `"PAID"` (intégration paiement à faire plus tard)
 *       - Le statut initial de la commande est `"NEW"`
 *
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderRequest'
 *     responses:
 *       201:
 *         description: Commande créée avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Données invalides (panier vide, méthode de paiement manquante, produit introuvable…).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Le panier est vide."
 *       500:
 *         description: Erreur serveur.
 */
router.post("/", orderController.createOrder);

/**
 * @swagger
 * /orders/user/{userId}:
 *   get:
 *     summary: Récupérer les commandes d'un utilisateur
 *     description: >
 *       Retourne toutes les commandes triées par date de création décroissante (`createdAt` desc)  
 *       pour l'utilisateur dont l'ID est fourni en paramètre.
 *
 *       ⚠️ La route est protégée par `auth` : le JWT est vérifié avant l'accès.
 *       Le contrôleur utilise directement le `userId` du paramètre pour filtrer :
 *       `Order.find({ user: userId })`.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du user dans MongoDB (ObjectId)
 *     responses:
 *       200:
 *         description: Liste des commandes de l'utilisateur (peut être vide).
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       401:
 *         description: JWT manquant ou invalide.
 *       500:
 *         description: Erreur serveur lors de la récupération des commandes.
 */
router.get("/user/:userId", orderController.getOrdersByUser);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Récupérer toutes les commandes (vue admin)
 *     description: >
 *       Retourne toutes les commandes de la boutique, triées par `createdAt` décroissant,  
 *       avec l'utilisateur peuplé (`user` → `firstName`, `lastName`, `email`).
 *
 *       💡 En pratique, tu pourras restreindre cette route aux administrateurs
 *       avec un middleware de rôle (non montré ici).
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste de toutes les commandes.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       401:
 *         description: JWT manquant ou invalide.
 *       500:
 *         description: Erreur serveur.
 */
router.get("/", orderController.getAllOrders);

/**
 * @swagger
 * /orders/{id}/status:
 *   patch:
 *     summary: Mettre à jour le statut d'une commande
 *     description: >
 *       Permet de modifier le **statut logistique** (`status`) et/ou le **statut du paiement** (`paymentStatus`)
 *       d'une commande existante.
 *
 *       - Au moins un des champs `status` ou `paymentStatus` doit être fourni.  
 *       - Si les deux sont absents → 400 "status ou paymentStatus obligatoire."
 *       - Si la commande n'existe pas → 404 "Commande introuvable."
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la commande (ObjectId MongoDB)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateOrderStatusRequest'
 *     responses:
 *       200:
 *         description: Commande mise à jour avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Aucune propriété à mettre à jour fournie (status/paymentStatus manquant).
 *       404:
 *         description: Commande introuvable.
 *       401:
 *         description: JWT manquant ou invalide.
 *       500:
 *         description: Erreur serveur.
 */
router.patch("/:id/status", orderController.updateOrderStatus);

module.exports = router;
