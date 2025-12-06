const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Gestion du panier utilisateur (ajout, mise à jour, suppression, vidage)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CartItem:
 *       type: object
 *       description: Une ligne du panier (produit + quantité)
 *       properties:
 *         product:
 *           type: string
 *           description: ID du produit (ObjectId MongoDB)
 *           example: "6765c4b63a0b944e1fb1d3c9"
 *         quantity:
 *           type: number
 *           minimum: 1
 *           example: 2
 *
 *     PopulatedCartItem:
 *       type: object
 *       description: Ligne de panier avec les infos produit peuplées
 *       properties:
 *         product:
 *           type: object
 *           description: Document produit minimal (populate depuis Mongo)
 *           properties:
 *             _id:
 *               type: string
 *               example: "6765c4b63a0b944e1fb1d3c9"
 *             name:
 *               type: string
 *               example: "iPhone 16 Pro Max"
 *             price:
 *               type: number
 *               example: 4999
 *             promoPrice:
 *               type: number
 *               nullable: true
 *               example: 4599
 *             images:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["https://cdn.example.com/prod/iphone16-1.jpg"]
 *             slug:
 *               type: string
 *               example: "iphone-16-pro-max"
 *         quantity:
 *           type: number
 *           example: 2
 *
 *     Cart:
 *       type: object
 *       description: Panier complet d'un utilisateur
 *       properties:
 *         _id:
 *           type: string
 *           example: "6770a6f92946d9e3a0a0f9c2"
 *         user:
 *           type: string
 *           description: ID de l'utilisateur propriétaire du panier
 *           example: "692b04d8c6576cd3df408260"
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PopulatedCartItem'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-12-05T14:23:11.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-12-05T15:01:42.000Z"
 *
 *     GetCartResponseEmpty:
 *       type: object
 *       description: Structure renvoyée quand l'utilisateur n'a pas encore de panier
 *       properties:
 *         user:
 *           type: string
 *           example: "692b04d8c6576cd3df408260"
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PopulatedCartItem'
 *           example: []
 *
 *     AddItemRequest:
 *       type: object
 *       required:
 *         - userId
 *         - productId
 *       properties:
 *         userId:
 *           type: string
 *           description: ID de l'utilisateur
 *           example: "692b04d8c6576cd3df408260"
 *         productId:
 *           type: string
 *           description: ID du produit à ajouter
 *           example: "6765c4b63a0b944e1fb1d3c9"
 *         quantity:
 *           type: number
 *           minimum: 1
 *           description: >
 *             Quantité à ajouter.  
 *             Si non fourni ou <= 0, le backend force à 1.
 *           example: 1
 *
 *     UpdateItemQuantityRequest:
 *       type: object
 *       required:
 *         - userId
 *         - productId
 *         - quantity
 *       properties:
 *         userId:
 *           type: string
 *           example: "692b04d8c6576cd3df408260"
 *         productId:
 *           type: string
 *           example: "6765c4b63a0b944e1fb1d3c9"
 *         quantity:
 *           type: number
 *           description: >
 *             Nouvelle quantité pour ce produit.  
 *             Si <= 0, le produit est retiré du panier.
 *           example: 3
 *
 *     RemoveItemRequest:
 *       type: object
 *       required:
 *         - userId
 *         - productId
 *       properties:
 *         userId:
 *           type: string
 *           example: "692b04d8c6576cd3df408260"
 *         productId:
 *           type: string
 *           example: "6765c4b63a0b944e1fb1d3c9"
 *
 *     ClearCartResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Panier vidé."
 */

/**
 * @swagger
 * /cart/user/{userId}:
 *   get:
 *     summary: Récupérer le panier d'un utilisateur
 *     description: >
 *       Retourne le panier associé à un `userId` donné.  
 *       - Si le panier existe : renvoie le document Cart complet (avec produits peuplés).  
 *       - Si aucun panier n'existe encore pour cet utilisateur : renvoie `{ user: userId, items: [] }`.
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur (ObjectId MongoDB)
 *     responses:
 *       200:
 *         description: Panier de l'utilisateur (existant ou vide).
 *         content:
 *           application/json:
 *             oneOf:
 *               - $ref: '#/components/schemas/Cart'
 *               - $ref: '#/components/schemas/GetCartResponseEmpty'
 *       500:
 *         description: Erreur serveur.
 */
router.get("/user/:userId", cartController.getCartByUser);

/**
 * @swagger
 * /cart/add:
 *   post:
 *     summary: Ajouter un produit au panier
 *     description: >
 *       Ajoute un produit au panier d'un utilisateur.  
 *
 *       **Comportement côté backend :**
 *       - Vérifie que `userId` et `productId` sont présents.  
 *       - Vérifie que le produit existe et est actif (`isActive = true`).  
 *       - Si aucun panier n'existe pour ce user → crée un nouveau panier avec cet item.  
 *       - Si le panier existe déjà :
 *         - si le produit est déjà présent → augmente la quantité  
 *         - sinon → ajoute une nouvelle ligne dans `items`  
 *       - Renvoyé : le panier (populate avec les infos produit).
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddItemRequest'
 *     responses:
 *       201:
 *         description: Panier créé pour cet utilisateur avec le nouvel item.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       200:
 *         description: Panier déjà existant, produit ajouté/mis à jour.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       400:
 *         description: userId ou productId manquant.
 *       404:
 *         description: Produit introuvable ou inactif.
 *       500:
 *         description: Erreur serveur.
 */
router.post("/add", cartController.addItem);

/**
 * @swagger
 * /cart/update:
 *   put:
 *     summary: Mettre à jour la quantité d'un produit dans le panier
 *     description: >
 *       Met à jour la quantité d'un produit pour un utilisateur.  
 *
 *       **Règles côté backend :**
 *       - Si `quantity <= 0` → le produit est retiré du panier.  
 *       - Si la ligne n'existe pas → 404 "Produit introuvable dans le panier."  
 *       - Si le panier n'existe pas → 404 "Panier introuvable."  
 *       - Retourne toujours le panier mis à jour (populate) en cas de succès.
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateItemQuantityRequest'
 *     responses:
 *       200:
 *         description: Panier mis à jour avec la nouvelle quantité.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       400:
 *         description: userId, productId ou quantity manquant.
 *       404:
 *         description: Panier ou produit introuvable.
 *       500:
 *         description: Erreur serveur.
 */
router.put("/update", cartController.updateItemQuantity);

/**
 * @swagger
 * /cart/remove:
 *   delete:
 *     summary: Supprimer un produit du panier
 *     description: >
 *       Supprime une ligne spécifique du panier (un produit).  
 *
 *       **Règles côté backend :**
 *       - Vérifie `userId` et `productId`.  
 *       - Si le panier n'existe pas → 404 "Panier introuvable."  
 *       - Filtre `items` pour enlever le produit.  
 *       - Retourne le panier mis à jour (populate) en cas de succès.
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RemoveItemRequest'
 *     responses:
 *       200:
 *         description: Panier mis à jour après suppression du produit.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       400:
 *         description: userId ou productId manquant.
 *       404:
 *         description: Panier introuvable.
 *       500:
 *         description: Erreur serveur.
 */
router.delete("/remove", cartController.removeItem);

/**
 * @swagger
 * /cart/clear/{userId}:
 *   delete:
 *     summary: Vider entièrement le panier d'un utilisateur
 *     description: >
 *       Supprime tous les items du panier d'un utilisateur.  
 *
 *       **Comportement backend :**
 *       - Si aucun panier n'existe déjà pour ce user → renvoie `200` avec `Panier déjà vide.`  
 *       - Sinon → vide `items` et sauvegarde, puis renvoie `Panier vidé.`  
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Panier vidé (ou déjà vide).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClearCartResponse'
 *       500:
 *         description: Erreur serveur.
 */
router.delete("/clear/:userId", cartController.clearCart);

module.exports = router;
