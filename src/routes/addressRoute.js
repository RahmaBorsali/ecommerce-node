const express = require("express");
const router = express.Router();
const addressController = require("../controllers/addressController");
const auth = require("../middlewares/auth");

/**
 * @swagger
 * tags:
 *   name: Addresses
 *   description: Gestion des adresses de livraison/facturation d'un utilisateur
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
 *     Address:
 *       type: object
 *       description: Adresse liée à un utilisateur
 *       properties:
 *         _id:
 *           type: string
 *           example: "6765c4b63a0b944e1fb1d3c9"
 *         user:
 *           type: string
 *           description: ID de l'utilisateur propriétaire de l'adresse
 *           example: "692b04d8c6576cd3df408260"
 *         label:
 *           type: string
 *           nullable: true
 *           description: Nom de l'adresse (Maison, Travail, etc.)
 *           example: "Maison"
 *         firstName:
 *           type: string
 *           example: "Rahma"
 *         lastName:
 *           type: string
 *           example: "Borsali"
 *         phone:
 *           type: string
 *           example: "+21612345678"
 *         line1:
 *           type: string
 *           description: Ligne d'adresse principale (rue, n°, etc.)
 *           example: "12 Rue de la Liberté"
 *         line2:
 *           type: string
 *           nullable: true
 *           description: Complément d'adresse (appartement, étage…)
 *           example: "Appartement 4B"
 *         city:
 *           type: string
 *           example: "Tunis"
 *         postalCode:
 *           type: string
 *           example: "1002"
 *         country:
 *           type: string
 *           example: "Tunisia"
 *         isDefault:
 *           type: boolean
 *           description: Indique si cette adresse est l'adresse par défaut de l'utilisateur
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-12-05T14:23:11.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-12-05T14:24:03.000Z"
 *
 *     CreateAddressRequest:
 *       type: object
 *       required:
 *         - userId
 *         - firstName
 *         - lastName
 *         - phone
 *         - line1
 *         - city
 *         - postalCode
 *       properties:
 *         userId:
 *           type: string
 *           description: ID de l'utilisateur à qui rattacher l'adresse
 *           example: "692b04d8c6576cd3df408260"
 *         label:
 *           type: string
 *           nullable: true
 *           description: Nom de l'adresse (Maison, Travail, etc.)
 *           example: "Maison"
 *         firstName:
 *           type: string
 *           example: "Rahma"
 *         lastName:
 *           type: string
 *           example: "Borsali"
 *         phone:
 *           type: string
 *           example: "+21612345678"
 *         line1:
 *           type: string
 *           description: Ligne d'adresse principale
 *           example: "12 Rue de la Liberté"
 *         line2:
 *           type: string
 *           nullable: true
 *           description: Complément d'adresse
 *           example: "Appartement 4B"
 *         city:
 *           type: string
 *           example: "Tunis"
 *         postalCode:
 *           type: string
 *           example: "1002"
 *         country:
 *           type: string
 *           description: Si non fourni, ton backend peut mettre une valeur par défaut (par ex. 'Tunisia')
 *           example: "Tunisia"
 *         isDefault:
 *           type: boolean
 *           description: Si true, cette adresse devient l'adresse par défaut de l'utilisateur
 *           example: true
 *
 *     UpdateAddressRequest:
 *       type: object
 *       description: >
 *         Payload pour mettre à jour une adresse existante.  
 *         Tous les champs sont optionnels, tu ne passes que ce que tu veux modifier.
 *       properties:
 *         label:
 *           type: string
 *           example: "Bureau"
 *         firstName:
 *           type: string
 *           example: "Rahma"
 *         lastName:
 *           type: string
 *           example: "Borsali"
 *         phone:
 *           type: string
 *           example: "+21698765432"
 *         line1:
 *           type: string
 *           example: "25 Avenue de Paris"
 *         line2:
 *           type: string
 *           example: "Étage 3"
 *         city:
 *           type: string
 *           example: "Tunis"
 *         postalCode:
 *           type: string
 *           example: "1002"
 *         country:
 *           type: string
 *           example: "Tunisia"
 *         isDefault:
 *           type: boolean
 *           description: >
 *             Tu peux aussi gérer isDefault ici, mais tu as une route dédiée `/default`.  
 *             À toi de décider la logique côté controller.
 *           example: false
 */

// 🔐 toutes les routes /addresses nécessitent un JWT valide
router.use(auth);

/**
 * @swagger
 * /addresses:
 *   post:
 *     summary: Créer une adresse pour un utilisateur
 *     description: >
 *       Crée une nouvelle adresse liée à un utilisateur.  
 *       Le middleware `auth` vérifie que le JWT est valide avant d'autoriser l'opération.
 *
 *       **Règles possibles côté controller (en général)** :
 *       - Le `userId` doit exister et correspondre à un utilisateur valide
 *       - Si `isDefault` est true, les autres adresses de l'utilisateur peuvent être mises à `false`
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAddressRequest'
 *     responses:
 *       201:
 *         description: Adresse créée avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Address'
 *       400:
 *         description: Données invalides (champs manquants, user inexistant, etc.).
 *       401:
 *         description: JWT manquant ou invalide.
 *       500:
 *         description: Erreur serveur.
 */
router.post("/", addressController.createAddress);

/**
 * @swagger
 * /addresses/user/{userId}:
 *   get:
 *     summary: Récupérer les adresses d'un utilisateur
 *     description: >
 *       Retourne la liste de toutes les adresses liées à un utilisateur donné.  
 *       En général, le controller renvoie les adresses triées et peut s'assurer  
 *       qu'il n'y a qu'une seule adresse `isDefault = true`.
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur (ObjectId MongoDB)
 *     responses:
 *       200:
 *         description: Liste des adresses de l'utilisateur (peut être vide).
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Address'
 *       401:
 *         description: JWT manquant ou invalide.
 *       500:
 *         description: Erreur serveur.
 */
router.get("/user/:userId", addressController.getAddressesByUser);

/**
 * @swagger
 * /addresses/{id}:
 *   patch:
 *     summary: Mettre à jour une adresse
 *     description: >
 *       Met à jour une adresse existante.  
 *       Tu n'es pas obligée d'envoyer tous les champs, seulement ceux à modifier.
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'adresse (ObjectId MongoDB)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateAddressRequest'
 *     responses:
 *       200:
 *         description: Adresse mise à jour avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Address'
 *       400:
 *         description: Données invalides.
 *       404:
 *         description: Adresse non trouvée.
 *       401:
 *         description: JWT manquant ou invalide.
 *       500:
 *         description: Erreur serveur.
 */
router.patch("/:id", addressController.updateAddress);

/**
 * @swagger
 * /addresses/{id}:
 *   delete:
 *     summary: Supprimer une adresse
 *     description: >
 *       Supprime une adresse spécifique.  
 *       Le controller peut éventuellement empêcher la suppression si c'est l'unique adresse
 *       ou si c'est l'adresse par défaut (logique métier à ta main).
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'adresse (ObjectId MongoDB)
 *     responses:
 *       200:
 *         description: Adresse supprimée avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Adresse supprimée."
 *       404:
 *         description: Adresse non trouvée.
 *       401:
 *         description: JWT manquant ou invalide.
 *       500:
 *         description: Erreur serveur.
 */
router.delete("/:id", addressController.deleteAddress);

/**
 * @swagger
 * /addresses/{id}/default:
 *   patch:
 *     summary: Définir une adresse comme adresse par défaut
 *     description: >
 *       Marque cette adresse comme **adresse par défaut** pour l'utilisateur.  
 *       Côté controller, la logique habituelle est :
 *
 *       - mettre `isDefault = false` sur toutes les autres adresses du même user  
 *       - mettre `isDefault = true` sur l'adresse ciblée  
 *
 *       De cette façon, il n'y a **qu'une seule adresse par défaut** à la fois.
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'adresse à définir comme par défaut
 *     responses:
 *       200:
 *         description: Adresse définie comme par défaut.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Address'
 *       404:
 *         description: Adresse non trouvée.
 *       401:
 *         description: JWT manquant ou invalide.
 *       500:
 *         description: Erreur serveur.
 */
router.patch("/:id/default", addressController.setDefaultAddress);

module.exports = router;
