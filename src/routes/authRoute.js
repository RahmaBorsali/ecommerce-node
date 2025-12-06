const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Inscription, connexion, vérification d'email et gestion des tokens
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     SignupRequest:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - address
 *         - password
 *       properties:
 *         firstName:
 *           type: string
 *           example: Rahma
 *         lastName:
 *           type: string
 *           example: Borsali
 *         email:
 *           type: string
 *           format: email
 *           example: rahma@example.com
 *         address:
 *           type: string
 *           example: 10 Rue de la Paix, Paris
 *         password:
 *           type: string
 *           format: password
 *           description: Doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.
 *           example: Azerty123
 *
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: rahma@example.com
 *         password:
 *           type: string
 *           format: password
 *           example: Azerty123
 *
 *     UserSafe:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: 6650f1e923c8f1b7b232a1cd
 *         firstName:
 *           type: string
 *           example: Rahma
 *         lastName:
 *           type: string
 *           example: Borsali
 *         email:
 *           type: string
 *           format: email
 *           example: rahma@example.com
 *         address:
 *           type: string
 *           example: 10 Rue de la Paix, Paris
 *         isVerified:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     LoginResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Connexion réussie.
 *         user:
 *           $ref: '#/components/schemas/UserSafe'
 *         token:
 *           type: string
 *           description: Access token JWT (Bearer token)
 *         refreshToken:
 *           type: string
 *           description: Refresh token JWT
 *
 *     RefreshTokenRequest:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           description: Refresh token valide
 *
 *     NewAccessTokenResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: Nouveau access token JWT
 */

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur avec vérification d'email
 *     description: >
 *       Crée un utilisateur non vérifié, vérifie la validité basique de l'email, 
 *       hash le mot de passe et enregistre un token de vérification.  
 *       L'envoi de l'email de vérification est fait **en arrière-plan** via une queue Redis.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignupRequest'
 *     responses:
 *       200:
 *         description: Compte créé, email de vérification envoyé en arrière-plan.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Compte créé. Vérifie ta boîte mail pour activer ton compte."
 *       400:
 *         description: Données invalides (email déjà utilisé, format email, mot de passe faible, etc.).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Erreur serveur.
 */
router.post("/signup", authController.signup);

/**
 * @swagger
 * /auth/verify-email:
 *   get:
 *     summary: Vérification d'adresse email via lien
 *     description: >
 *       Valide le token de vérification reçu par email, marque l'utilisateur comme vérifié,
 *       supprime le token de vérification et envoie un email de bienvenue en arrière-plan via Redis.
 *       En cas de FRONT_SERVER_URL configuré, redirige vers la page de connexion du front.
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de vérification envoyé par email
 *     responses:
 *       200:
 *         description: Email vérifié avec succès (texte brut ou redirection).
 *       400:
 *         description: Token manquant, invalide ou expiré, ou utilisateur introuvable.
 *       500:
 *         description: Erreur serveur.
 */
router.get("/verify-email", authController.verifyEmail);


/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Connexion utilisateur
 *     description: >
 *       Authentifie un utilisateur avec email et mot de passe.  
 *       Vérifie que le compte est bien **vérifié par email** avant d'autoriser la connexion.  
 *       Retourne un access token et un refresh token JWT.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Connexion réussie.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Email ou mot de passe incorrect / données manquantes.
 *       403:
 *         description: Compte non vérifié par email.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Compte non vérifié. Merci de vérifier votre email avant de vous connecter."
 *       500:
 *         description: Erreur serveur.
 */
router.post("/login", authController.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Rafraîchir le token d'accès
 *     description: >
 *       Vérifie le refresh token et génère un **nouveau access token**.  
 *       N'émet pas de nouveau refresh token.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Nouveau access token généré.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NewAccessTokenResponse'
 *       400:
 *         description: Refresh token manquant.
 *       403:
 *         description: Refresh token invalide ou expiré.
 *       500:
 *         description: Erreur serveur.
 */
router.post("/refresh", authController.refreshToken);

module.exports = router;