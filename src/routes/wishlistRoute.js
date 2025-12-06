const express = require("express");
const router = express.Router();
const wishlistController = require("../controllers/wishlistController");
const auth = require("../middlewares/auth");

// Toutes les routes wishlist sont protégées par JWT
router.use(auth);

/**
 * @swagger
 * tags:
 *   name: Wishlist
 *   description: Gestion de la liste de favoris (wishlist) d'un utilisateur
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     WishlistProduct:
 *       type: object
 *       description: Produit minimal renvoyé dans la wishlist
 *       properties:
 *         _id:
 *           type: string
 *           example: "6770b8c52946d9e3a0a0f9d0"
 *         name:
 *           type: string
 *           example: "Sac en cuir noir"
 *         slug:
 *           type: string
 *           example: "sac-cuir-noir"
 *         price:
 *           type: number
 *           example: 120
 *         promoPrice:
 *           type: number
 *           nullable: true
 *           example: 99
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - "https://cdn.example.com/images/sac1.jpg"
 *             - "https://cdn.example.com/images/sac1-alt.jpg"
 *         stock:
 *           type: number
 *           example: 12
 *
 *     WishlistArrayResponse:
 *       type: array
 *       description: Tableau de produits présents dans la wishlist de l'utilisateur
 *       items:
 *         $ref: '#/components/schemas/WishlistProduct'
 *
 *     WishlistAddRemoveRequest:
 *       type: object
 *       required:
 *         - userId
 *         - productId
 *       properties:
 *         userId:
 *           type: string
 *           description: ID MongoDB de l'utilisateur
 *           example: "6770a6f92946d9e3a0a0f9c2"
 *         productId:
 *           type: string
 *           description: ID MongoDB du produit
 *           example: "6770b8c52946d9e3a0a0f9d0"
 *
 *     WishlistMutationResponse:
 *       type: object
 *       description: Réponse standard pour ajout/suppression/clear
 *       properties:
 *         message:
 *           type: string
 *           example: "Produit ajouté à la wishlist."
 *         wishlist:
 *           type: array
 *           description: Tableau d'ID produit dans la wishlist
 *           items:
 *             type: string
 *           example:
 *             - "6770b8c52946d9e3a0a0f9d0"
 *             - "6770b8c52946d9e3a0a0f9d1"
 */

/**
 * @swagger
 * /wishlist/{userId}:
 *   get:
 *     summary: Récupérer la wishlist d'un utilisateur
 *     description: >
 *       Retourne la liste des produits présents dans la wishlist d'un utilisateur donné.  
 *       La route est protégée par JWT (middleware `auth`) : le token doit être passé dans `Authorization: Bearer <token>`.  
 *
 *       **Comportement du controller :**
 *       - Vérifie que `userId` est présent dans l'URL.  
 *       - Charge l'utilisateur et peuple le champ `wishlist` avec des données de produits (`name`, `slug`, `price`, `promoPrice`, `images`, `stock`).  
 *       - Si l'utilisateur n'existe pas → 404.  
 *       - Renvoie un tableau de produits (ou `[]` si la wishlist est vide).
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID MongoDB de l'utilisateur dont on veut la wishlist
 *         schema:
 *           type: string
 *           example: "6770a6f92946d9e3a0a0f9c2"
 *     responses:
 *       200:
 *         description: Wishlist de l'utilisateur récupérée avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WishlistArrayResponse'
 *       400:
 *         description: userId manquant.
 *       404:
 *         description: Utilisateur introuvable.
 *       500:
 *         description: Erreur serveur.
 */
router.get("/:userId", wishlistController.getWishlist);

/**
 * @swagger
 * /wishlist:
 *   post:
 *     summary: Ajouter un produit à la wishlist
 *     description: >
 *       Ajoute un produit à la wishlist d'un utilisateur.  
 *       La route est protégée par JWT (middleware `auth`).  
 *
 *       **Règles côté backend :**
 *       - Le body doit contenir `userId` et `productId`.  
 *       - Vérifie que l'utilisateur existe.  
 *       - Vérifie que le produit existe **et** qu'il est actif (`isActive`).  
 *       - Si le produit est déjà dans la wishlist → 200 avec un message `"Produit déjà dans la wishlist."` et la liste actuelle.  
 *       - Sinon, ajoute le produit à la liste et enregistre l'utilisateur.  
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WishlistAddRemoveRequest'
 *     responses:
 *       201:
 *         description: Produit ajouté à la wishlist.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WishlistMutationResponse'
 *       200:
 *         description: Produit déjà présent dans la wishlist (pas de duplication).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WishlistMutationResponse'
 *       400:
 *         description: userId ou productId manquant.
 *       404:
 *         description: Utilisateur ou produit introuvable / inactif.
 *       500:
 *         description: Erreur serveur.
 */
router.post("/", wishlistController.addToWishlist);

/**
 * @swagger
 * /wishlist:
 *   delete:
 *     summary: Retirer un produit de la wishlist
 *     description: >
 *       Retire un produit spécifique de la wishlist d'un utilisateur.  
 *       La route est protégée par JWT (middleware `auth`).  
 *
 *       **Comportement :**
 *       - Body requis : `userId`, `productId`.  
 *       - Vérifie que l'utilisateur existe.  
 *       - Filtre la propriété `wishlist` pour supprimer ce `productId`.  
 *       - Sauvegarde l'utilisateur et renvoie la nouvelle liste d'ID.  
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WishlistAddRemoveRequest'
 *     responses:
 *       200:
 *         description: Produit retiré de la wishlist.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WishlistMutationResponse'
 *       400:
 *         description: userId ou productId manquant.
 *       404:
 *         description: Utilisateur introuvable.
 *       500:
 *         description: Erreur serveur.
 */
router.delete("/", wishlistController.removeFromWishlist);

/**
 * @swagger
 * /wishlist/clear/{userId}:
 *   delete:
 *     summary: Vider complètement la wishlist d'un utilisateur
 *     description: >
 *       Supprime **tous** les produits de la wishlist d'un utilisateur.  
 *       La route est protégée par JWT (middleware `auth`).  
 *
 *       **Comportement :**
 *       - Vérifie que `userId` est présent dans les paramètres.  
 *       - Charge l'utilisateur.  
 *       - Si l'utilisateur n'existe pas → 404.  
 *       - Met `user.wishlist = []` puis sauvegarde.  
 *       - Renvoie un message de confirmation et la wishlist (désormais vide).  
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID MongoDB de l'utilisateur
 *         schema:
 *           type: string
 *           example: "6770a6f92946d9e3a0a0f9c2"
 *     responses:
 *       200:
 *         description: Wishlist vidée avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WishlistMutationResponse'
 *       400:
 *         description: userId manquant.
 *       404:
 *         description: Utilisateur introuvable.
 *       500:
 *         description: Erreur serveur.
 */
router.delete("/clear/:userId", wishlistController.clearWishlist);

module.exports = router;
