const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const uploadAvatar = require("../middlewares/uploadAvatar");

// Profil
router.get("/:id", userController.getProfile);
router.put("/:id", userController.updateProfile);

// Avatar
router.post(
  "/:id/avatar",
  uploadAvatar.single("avatar"), // champ FormData = "avatar"
  userController.updateAvatar
);

module.exports = router;
