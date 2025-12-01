const User = require("../models/userModel");

// GET /users/:id
exports.getProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    return res.status(200).json(user);
  } catch (err) {
    console.error("getProfile error:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// PUT /users/:id  → prénom, nom, téléphone, ville, pays, adresse
exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      address,
      city,
      country,
      phone,
      // email,  // l’email est en lecture seule dans ton UI, donc on ne le touche pas
    } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName  !== undefined) user.lastName  = lastName;
    if (address   !== undefined) user.address   = address;
    if (city      !== undefined) user.city      = city;
    if (country   !== undefined) user.country   = country;
    if (phone     !== undefined) user.phone     = phone;

    await user.save();

    const clean = user.toObject();
    delete clean.password;

    return res.status(200).json(clean);
  } catch (err) {
    console.error("updateProfile error:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.updateAvatar = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier envoyé." });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    // URL absolue basée sur la requête
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const avatarUrl = `${baseUrl}/uploads/avatars/${req.file.filename}`;

    user.avatarUrl = avatarUrl;
    await user.save();

    const clean = user.toObject();
    delete clean.password;

    return res.status(200).json({
      message: "Avatar mis à jour.",
      user: clean,
    });
  } catch (err) {
    console.error("updateAvatar error:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};


