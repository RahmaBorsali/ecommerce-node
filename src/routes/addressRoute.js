const express = require("express");
const router = express.Router();
const addressController = require("../controllers/addressController");
const auth = require("../middlewares/auth");

router.use(auth);
// Créer une adresse
router.post("/", addressController.createAddress);

// Récupérer les adresses d'un user
router.get("/user/:userId", addressController.getAddressesByUser);

// Mettre à jour une adresse
router.patch("/:id", addressController.updateAddress);

// Supprimer une adresse
router.delete("/:id", addressController.deleteAddress);

// Définir une adresse comme par défaut
router.patch("/:id/default", addressController.setDefaultAddress);

module.exports = router;
