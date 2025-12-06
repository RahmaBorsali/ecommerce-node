const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Gestion des produits de la boutique
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 6650f1e923c8f1b7b232a1cd
 *         name:
 *           type: string
 *           example: iPhone 15 Pro
 *         slug:
 *           type: string
 *           description: Identifiant unique pour l’URL
 *           example: iphone-15-pro
 *         description:
 *           type: string
 *           example: "Smartphone haut de gamme avec écran OLED et triple caméra."
 *         price:
 *           type: number
 *           example: 1299
 *         promoPrice:
 *           type: number
 *           nullable: true
 *           description: Prix promotionnel (optionnel)
 *           example: 1199
 *         category:
 *           type: string
 *           description: ID de la catégorie (MongoDB ObjectId)
 *           example: 664ffae423c8f1b7b232a1ab
 *         images:
 *           type: array
 *           description: URLs des images produit
 *           items:
 *             type: string
 *             example: "https://cdn.example.com/products/iphone15-front.jpg"
 *         stock:
 *           type: integer
 *           description: Quantité disponible en stock
 *           example: 42
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["apple", "smartphone", "5g"]
 *         isFeatured:
 *           type: boolean
 *           description: Produit mis en avant sur la home
 *           example: true
 *         isActive:
 *           type: boolean
 *           description: Produit visible sur le site
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     ProductCreateRequest:
 *       type: object
 *       required:
 *         - name
 *         - slug
 *         - price
 *         - category
 *       properties:
 *         name:
 *           type: string
 *           example: iPhone 15 Pro
 *         slug:
 *           type: string
 *           example: iphone-15-pro
 *         description:
 *           type: string
 *           example: "Smartphone haut de gamme avec écran OLED et triple caméra."
 *         price:
 *           type: number
 *           example: 1299
 *         promoPrice:
 *           type: number
 *           example: 1199
 *         category:
 *           type: string
 *           description: ID de la catégorie (MongoDB)
 *           example: 664ffae423c8f1b7b232a1ab
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - "https://cdn.example.com/products/iphone15-front.jpg"
 *             - "https://cdn.example.com/products/iphone15-back.jpg"
 *         stock:
 *           type: integer
 *           example: 50
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["apple", "smartphone", "5g"]
 *         isFeatured:
 *           type: boolean
 *           example: true
 */

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Créer un nouveau produit
 *     description: >
 *       Crée un produit.  
 *       Le backend vérifie que **name**, **slug**, **price** et **category** sont fournis.
 *       Le `slug` doit être unique : si un produit existe déjà avec ce slug, une erreur 400 est renvoyée.
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductCreateRequest'
 *     responses:
 *       201:
 *         description: Produit créé avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Données invalides ou slug déjà utilisé.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Un produit existe déjà avec ce slug."
 *       500:
 *         description: Erreur serveur.
 */
router.post("/", productController.createProduct);

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Récupérer la liste des produits
 *     description: >
 *       Retourne tous les produits actifs (**isActive = true**)  
 *       avec filtres possibles sur la catégorie, le texte et les produits mis en avant.
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: ID de la catégorie (MongoDB ObjectId)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Texte de recherche sur le nom du produit (regex insensible à la casse).
 *       - in: query
 *         name: featured
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Si `featured=true`, ne retourne que les produits mis en avant (**isFeatured = true**).
 *     responses:
 *       200:
 *         description: Liste des produits filtrés.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       500:
 *         description: Erreur serveur.
 */
router.get("/", productController.getProducts);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Récupérer un produit par son ID
 *     description: >
 *       Retourne un produit spécifique à partir de son identifiant MongoDB,  
 *       avec la catégorie peuplée (`category` avec `name` et `slug`).
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du produit (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Produit trouvé.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Produit non trouvé.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Produit non trouvé"
 *       500:
 *         description: Erreur serveur.
 */
router.get("/:id", productController.getProductById);

module.exports = router;
