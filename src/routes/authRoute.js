const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// POST /auth/signup
router.post("/signup", authController.signup);

// GET /auth/verify-email?token=...
router.get("/verify-email", authController.verifyEmail);


// POST /auth/login
router.post("/login", authController.login);


module.exports = router;
