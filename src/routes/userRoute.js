const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const uploadAvatar = require("../middlewares/uploadAvatar");

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestion du profil utilisateur (infos et avatar)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UserProfile:
 *       type: object
 *       description: Profil utilisateur retourné par l’API
 *       properties:
 *         _id:
 *           type: string
 *           example: "6770a6f92946d9e3a0a0f9c2"
 *         firstName:
 *           type: string
 *           example: "Rahma"
 *         lastName:
 *           type: string
 *           example: "Borsali"
 *         email:
 *           type: string
 *           example: "rahma@example.com"
 *         address:
 *           type: string
 *           nullable: true
 *           example: "12 rue des Fleurs"
 *         city:
 *           type: string
 *           nullable: true
 *           example: "Tunis"
 *         country:
 *           type: string
 *           nullable: true
 *           example: "Tunisie"
 *         phone:
 *           type: string
 *           nullable: true
 *           example: "+216 20 000 000"
 *         avatarUrl:
 *           type: string
 *           nullable: true
 *           description: URL absolue de l’avatar
 *           example: "http://localhost:3000/uploads/avatars/avatar_6770a6f9.png"
 *         isVerified:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-01-04T10:15:30.000Z"
 *
 *     UserUpdateRequest:
 *       type: object
 *       description: Champs modifiables du profil utilisateur
 *       properties:
 *         firstName:
 *           type: string
 *           example: "Rahmaaa"
 *         lastName:
 *           type: string
 *           example: "Borsali"
 *         address:
 *           type: string
 *           example: "15 Avenue Habib Bourguiba"
 *         city:
 *           type: string
 *           example: "Tunis"
 *         country:
 *           type: string
 *           example: "Tunisie"
 *         phone:
 *           type: string
 *           example: "+216 22 333 444"
 *
 *     AvatarUploadResponse:
 *       type: object
 *       description: Réponse après mise à jour de l’avatar
 *       properties:
 *         message:
 *           type: string
 *           example: "Avatar mis à jour."
 *         user:
 *           $ref: '#/components/schemas/UserProfile'
 */

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Récupérer le profil d’un utilisateur
 *     description: >
 *       Retourne les informations de profil d’un utilisateur, sans le mot de passe.  
 *       **Le mot de passe est toujours exclu côté backend (`select("-password")`).**
 *
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID MongoDB de l'utilisateur
 *         schema:
 *           type: string
 *           example: "6770a6f92946d9e3a0a0f9c2"
 *     responses:
 *       200:
 *         description: Profil utilisateur trouvé.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       404:
 *         description: Utilisateur introuvable.
 *       500:
 *         description: Erreur serveur.
 */
router.get("/:id", userController.getProfile);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Mettre à jour le profil utilisateur
 *     description: >
 *       Met à jour les informations de profil (prénom, nom, adresse, ville, pays, téléphone).  
 *       L’email n’est **pas** modifié (lecture seule dans ton UI).  
 *
 *       **Côté backend :**
 *       - Charge l’utilisateur par `id`.  
 *       - Met à jour uniquement les champs présents dans le body (`firstName`, `lastName`, `address`, `city`, `country`, `phone`).  
 *       - Sauvegarde, enlève `password` de la réponse et renvoie l’objet utilisateur.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID MongoDB de l'utilisateur à mettre à jour
 *         schema:
 *           type: string
 *           example: "6770a6f92946d9e3a0a0f9c2"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdateRequest'
 *     responses:
 *       200:
 *         description: Profil mis à jour avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       404:
 *         description: Utilisateur introuvable.
 *       500:
 *         description: Erreur serveur.
 */
router.put("/:id", userController.updateProfile);

/**
 * @swagger
 * /users/{id}/avatar:
 *   post:
 *     summary: Mettre à jour l’avatar de l’utilisateur
 *     description: >
 *       Upload d’une nouvelle image d’avatar via `multipart/form-data`.  
 *
 *       **Détails d’implémentation :**
 *       - Le middleware `uploadAvatar.single("avatar")` utilise Multer et attend un champ fichier nommé **"avatar"** dans le FormData.  
 *       - Le fichier est stocké dans un dossier (par ex. `uploads/avatars`).  
 *       - L’URL publique est construite à partir de `req.protocol` + `req.get("host")` + `/uploads/avatars/<filename>`.  
 *       - Le champ `avatarUrl` est enregistré sur le document `User`.  
 *       - Le mot de passe est retiré de l’objet avant renvoi.  
 *
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID MongoDB de l'utilisateur
 *         schema:
 *           type: string
 *           example: "6770a6f92946d9e3a0a0f9c2"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Fichier image (jpg, png, etc.)
 *     responses:
 *       200:
 *         description: Avatar mis à jour avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AvatarUploadResponse'
 *       400:
 *         description: Aucun fichier envoyé.
 *       404:
 *         description: Utilisateur introuvable.
 *       500:
 *         description: Erreur serveur.
 */
router.post(
  "/:id/avatar",
  uploadAvatar.single("avatar"), // champ FormData = "avatar"
  userController.updateAvatar
);

module.exports = router;
