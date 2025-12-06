const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Gestion des avis produits (notes, commentaires, moyenne par produit)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       description: Avis laissé sur un produit
 *       properties:
 *         _id:
 *           type: string
 *           example: "6770bbf52946d9e3a0a0f9d1"
 *         product:
 *           type: string
 *           description: ID du produit concerné
 *           example: "676ff2c32946d9e3a0a0f8a1"
 *         user:
 *           type: string
 *           nullable: true
 *           description: ID de l'utilisateur ayant laissé l'avis (ou null si anonyme)
 *           example: "6770a6f92946d9e3a0a0f9c2"
 *         rating:
 *           type: number
 *           format: float
 *           description: Note sur 5
 *           minimum: 1
 *           maximum: 5
 *           example: 4.5
 *         comment:
 *           type: string
 *           nullable: true
 *           example: "Super produit, bonne qualité !"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-01-05T14:12:30.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-01-06T09:20:10.000Z"
 *
 *     ReviewCreateRequest:
 *       type: object
 *       description: Payload pour créer ou mettre à jour un avis
 *       required:
 *         - productId
 *         - rating
 *       properties:
 *         productId:
 *           type: string
 *           description: ID du produit
 *           example: "676ff2c32946d9e3a0a0f8a1"
 *         userId:
 *           type: string
 *           nullable: true
 *           description: ID de l'utilisateur (si connecté)
 *           example: "6770a6f92946d9e3a0a0f9c2"
 *         rating:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *           example: 5
 *         comment:
 *           type: string
 *           nullable: true
 *           example: "Livraison rapide, produit conforme à la description."
 */

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Créer ou mettre à jour un avis sur un produit
 *     description: >
 *       Crée un nouvel avis ou met à jour l'avis existant **pour le même couple (productId, userId)**.  
 *
 *       Règles métier :
 *       - `productId` et `rating` sont obligatoires.  
 *       - `rating` doit être entre **1 et 5**.  
 *       - Si `userId` est fourni et que cet utilisateur a déjà laissé un avis pour ce produit → l'avis est **mis à jour** (rating + comment).  
 *       - Si aucun avis existant, un **nouvel avis** est créé.  
 *       - Après chaque création / mise à jour, la moyenne (`averageRating`) et le nombre d'avis (`reviewsCount`) du **produit** sont recalculés via une agrégation MongoDB.
 *
 *     tags: [Reviews]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReviewCreateRequest'
 *     responses:
 *       201:
 *         description: Avis créé ou mis à jour avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       400:
 *         description: >
 *           Données invalides (ex: productId/rating manquants, rating hors [1..5], produit introuvable).
 *       404:
 *         description: Produit ou utilisateur introuvable (si userId fourni).
 *       500:
 *         description: Erreur serveur.
 */
router.post("/", reviewController.createReview);

/**
 * @swagger
 * /reviews/product/{productId}:
 *   get:
 *     summary: Récupérer tous les avis d’un produit
 *     description: >
 *       Retourne la liste des avis associés à un produit, triés par `createdAt` décroissant (du plus récent au plus ancien).  
 *
 *       Chaque avis contient :
 *       - `rating` (note /5)  
 *       - `comment`  
 *       - infos utilisateur peuplées via `populate("user", "firstName lastName email")`  
 *
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         description: ID du produit pour lequel récupérer les avis
 *         schema:
 *           type: string
 *           example: "676ff2c32946d9e3a0a0f8a1"
 *     responses:
 *       200:
 *         description: Liste des avis pour ce produit.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Review'
 *       500:
 *         description: Erreur serveur.
 */
router.get("/product/:productId", reviewController.getReviewsByProduct);

/**
 * @swagger
 * /reviews/{id}:
 *   delete:
 *     summary: Supprimer un avis
 *     description: >
 *       Supprime un avis par son ID, puis recalcule la moyenne (`averageRating`) et le nombre d'avis (`reviewsCount`) du produit lié.  
 *
 *       ⚠️ Logique backend :
 *       - Recherche l’avis par `id`.  
 *       - Si l’avis n’existe pas → 404.  
 *       - Supprime l’avis, puis appelle `recomputeProductRating(productId)` pour mettre à jour les champs d’agrégat du produit.  
 *
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de l'avis à supprimer
 *         schema:
 *           type: string
 *           example: "6770bbf52946d9e3a0a0f9d1"
 *     responses:
 *       200:
 *         description: Avis supprimé avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Avis supprimé."
 *       404:
 *         description: Avis introuvable.
 *       500:
 *         description: Erreur serveur.
 */
router.delete("/:id", reviewController.deleteReview);

module.exports = router;

