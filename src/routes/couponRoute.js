const express = require("express");
const router = express.Router();
const couponController = require("../controllers/couponController");

/**
 * @swagger
 * tags:
 *   name: Coupons
 *   description: Gestion des codes promotionnels (création & validation)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Coupon:
 *       type: object
 *       description: Modèle de coupon tel qu'enregistré en base MongoDB
 *       properties:
 *         _id:
 *           type: string
 *           example: "6770a6f92946d9e3a0a0f9c2"
 *         code:
 *           type: string
 *           description: Code promo en majuscules
 *           example: "SALE10"
 *         type:
 *           type: string
 *           description: Type de coupon
 *           enum: [PERCENT, FIXED, FREE_SHIPPING]
 *           example: "PERCENT"
 *         value:
 *           type: number
 *           description: >
 *             Valeur du coupon.  
 *             - Si type = PERCENT → % de réduction (ex: 10 pour 10%).  
 *             - Si type = FIXED → montant fixe (ex: 20 pour 20 DT).  
 *             - Si type = FREE_SHIPPING → généralement 0.
 *           example: 10
 *         freeShipping:
 *           type: boolean
 *           description: >
 *             Indique si le coupon offre la livraison gratuite, indépendamment du type.
 *           example: false
 *         minAmount:
 *           type: number
 *           description: Montant minimum du panier pour pouvoir utiliser le code.
 *           example: 150
 *         isActive:
 *           type: boolean
 *           description: Coupon actif ou non.
 *           example: true
 *         startDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Date de début de validité du coupon (optionnel).
 *           example: "2025-12-01T00:00:00.000Z"
 *         endDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Date de fin de validité du coupon (optionnel).
 *           example: "2026-01-01T00:00:00.000Z"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-12-05T14:23:11.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-12-05T15:01:42.000Z"
 *
 *     CreateCouponRequest:
 *       type: object
 *       required:
 *         - code
 *         - type
 *       properties:
 *         code:
 *           type: string
 *           description: Code promo (sera automatiquement stocké en MAJUSCULES).
 *           example: "sale10"
 *         type:
 *           type: string
 *           description: Type de réduction
 *           enum: [PERCENT, FIXED, FREE_SHIPPING]
 *           example: "PERCENT"
 *         value:
 *           type: number
 *           description: >
 *             Valeur du coupon (obligatoire pour PERCENT et FIXED).  
 *             Pour FREE_SHIPPING, peut être 0.
 *           example: 10
 *         freeShipping:
 *           type: boolean
 *           description: >
 *             Si true, offre aussi la livraison gratuite même si type = PERCENT ou FIXED.
 *           example: false
 *         minAmount:
 *           type: number
 *           description: Montant minimum du panier pour activer ce code.
 *           example: 150
 *         isActive:
 *           type: boolean
 *           description: Statut du coupon (par défaut true).
 *           example: true
 *
 *     ValidateCouponRequest:
 *       type: object
 *       required:
 *         - code
 *         - subtotal
 *       properties:
 *         code:
 *           type: string
 *           description: Code saisi par l'utilisateur (insensible à la casse).
 *           example: "SALE10"
 *         subtotal:
 *           type: number
 *           description: Montant actuel du panier (hors livraison).
 *           example: 200
 *
 *     ValidateCouponResponse:
 *       type: object
 *       description: Résultat de la validation d'un coupon
 *       properties:
 *         valid:
 *           type: boolean
 *           example: true
 *         code:
 *           type: string
 *           description: Code normalisé (toujours en MAJUSCULES).
 *           example: "SALE10"
 *         discount:
 *           type: number
 *           description: Montant de la réduction à appliquer sur le subtotal.
 *           example: 20
 *         freeShipping:
 *           type: boolean
 *           description: >
 *             Indique si la livraison doit être offerte.  
 *             - true si coupon.type = FREE_SHIPPING  
 *             - ou si coupon.freeShipping = true  
 *             - ou si le subtotal dépasse FREE_SHIPPING_THRESHOLD (8000 DT dans ton code).
 *           example: false
 *         message:
 *           type: string
 *           example: "Code promo appliqué."
 */

/**
 * @swagger
 * /coupons:
 *   post:
 *     summary: Créer un nouveau code promo
 *     description: >
 *       Crée un coupon en base de données.  
 *       Utilisé principalement via Postman ou un back-office admin.  
 *
 *       **Règles backend :**
 *       - `code` et `type` sont obligatoires.  
 *       - Le `code` est enregistré en MAJUSCULES (`SALE10`, `FREESHIP`, etc.).  
 *       - On vérifie qu'aucun autre coupon n'existe déjà avec ce même `code`.  
 *       - `isActive` vaut `true` par défaut si non fourni.  
 *       - `value` vaut `0` par défaut si non fourni.  
 *     tags: [Coupons]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCouponRequest'
 *     responses:
 *       201:
 *         description: Coupon créé avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Coupon'
 *       400:
 *         description: >
 *           Erreur de validation (ex: code déjà utilisé, code/type manquants).
 *       500:
 *         description: Erreur serveur.
 */
router.post("/", couponController.createCoupon);

/**
 * @swagger
 * /coupons/validate:
 *   post:
 *     summary: Valider un code promo côté frontend
 *     description: >
 *       Vérifie si un code promo est valide pour un montant de panier donné (`subtotal`).  
 *
 *       **Ce que fait le backend :**
 *       1. Vérifie que `code` et `subtotal` sont fournis.  
 *       2. Cherche un `Coupon` actif avec `code` (en majuscules).  
 *       3. Vérifie les dates `startDate` et `endDate` si présentes :  
 *          - si `startDate` > maintenant → "Ce code n'est pas encore actif."  
 *          - si `endDate` < maintenant → "Ce code est expiré."  
 *       4. Vérifie le montant minimum `minAmount` :  
 *          - si `subtotal` < `minAmount` → erreur 400 avec message.  
 *       5. Calcule la réduction :  
 *          - type = `PERCENT` → `discount = subtotal * value / 100`  
 *          - type = `FIXED` → `discount = value`  
 *          - type = `FREE_SHIPPING` → `discount = 0`, mais `freeShipping = true`  
 *       6. Gère la livraison gratuite :  
 *          - si `coupon.type === "FREE_SHIPPING"` **ou** `coupon.freeShipping === true` → `freeShipping = true`  
 *          - si `subtotal >= FREE_SHIPPING_THRESHOLD` (8000 DT dans ton controller) → `freeShipping = true`  
 *       7. Retourne un objet décrivant si le code est valide, combien déduire, et si la livraison doit être offerte.
 *     tags: [Coupons]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ValidateCouponRequest'
 *     responses:
 *       200:
 *         description: Code promo valide, renvoie le détail de l'application.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidateCouponResponse'
 *       400:
 *         description: >
 *           Erreur de validation (ex: code manquant, montant minimum non atteint, code pas encore actif/expiré).
 *       404:
 *         description: Code promo introuvable ou inactif.
 *       500:
 *         description: Erreur serveur.
 */
router.post("/validate", couponController.validateCoupon);

module.exports = router;
