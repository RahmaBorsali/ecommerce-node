const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Gestion des catégories de produits
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 6650f1e923c8f1b7b232a1cd
 *         name:
 *           type: string
 *           example: Smartphones
 *         slug:
 *           type: string
 *           example: smartphones
 *         description:
 *           type: string
 *           example: "Tous nos téléphones mobiles et smartphones."
 *         icon:
 *           type: string
 *           description: Nom d'icône ou classe CSS pour le front
 *           example: "ph:device-mobile"
 *         image:
 *           type: string
 *           description: URL d'une image illustrant la catégorie
 *           example: "https://cdn.example.com/cat/smartphones.jpg"
 *         isActive:
 *           type: boolean
 *           description: Catégorie visible ou non sur le site
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CategoryCreateRequest:
 *       type: object
 *       required:
 *         - name
 *         - slug
 *       properties:
 *         name:
 *           type: string
 *           description: Nom affiché de la catégorie
 *           example: Smartphones
 *         slug:
 *           type: string
 *           description: Identifiant unique pour l'URL
 *           example: smartphones
 *         description:
 *           type: string
 *           example: "Tous nos téléphones mobiles et smartphones."
 *         icon:
 *           type: string
 *           example: "ph:device-mobile"
 *         image:
 *           type: string
 *           example: "https://cdn.example.com/cat/smartphones.jpg"
 *         isActive:
 *           type: boolean
 *           description: Active ou non (par défaut true)
 *           example: true
 */

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Créer une nouvelle catégorie
 *     description: >
 *       Crée une catégorie de produits.  
 *       Le backend vérifie que **name** et **slug** sont fournis et qu'ils ne sont pas déjà utilisés
 *       (unicité sur name ou slug).
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryCreateRequest'
 *     responses:
 *       201:
 *         description: Catégorie créée avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         description: Données invalides ou catégorie déjà existante (name ou slug).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Cette catégorie existe déjà (name ou slug)."
 *       500:
 *         description: Erreur serveur.
 */
router.post("/", categoryController.createCategory);

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Récupérer la liste des catégories actives
 *     description: >
 *       Retourne toutes les catégories dont **isActive = true**, triées par nom (ordre croissant).
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Liste des catégories actives.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 *       500:
 *         description: Erreur serveur.
 */
router.get("/", categoryController.getCategories);

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Récupérer une catégorie par son ID
 *     description: >
 *       Retourne une catégorie spécifique à partir de son identifiant MongoDB.
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la catégorie (MongoDB)
 *     responses:
 *       200:
 *         description: Catégorie trouvée.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       404:
 *         description: Catégorie non trouvée.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Catégorie non trouvée"
 *       500:
 *         description: Erreur serveur.
 */
router.get("/:id", categoryController.getCategoryById);

module.exports = router;