const Address = require("../models/addressModel");

// POST /addresses
exports.createAddress = async (req, res) => {
  try {
    const {
      userId,
      label,
      firstName,
      lastName,
      phone,
      line1,
      line2,
      city,
      postalCode,
      country,
      isDefault,
    } = req.body;

    if (!userId || !firstName || !lastName || !phone || !line1 || !city || !postalCode) {
      return res.status(400).json({ message: "Champs obligatoires manquants." });
    }

    // Si nouvelle adresse par défaut, enlever le default des autres
    if (isDefault) {
      await Address.updateMany(
        { user: userId },
        { $set: { isDefault: false } }
      );
    }

    const addr = await Address.create({
      user: userId,
      label,
      firstName,
      lastName,
      phone,
      line1,
      line2,
      city,
      postalCode,
      country,
      isDefault: !!isDefault,
    });

    return res.status(201).json(addr);
  } catch (err) {
    console.error("createAddress error:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// GET /addresses/user/:userId
exports.getAddressesByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const addresses = await Address.find({ user: userId }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    return res.status(200).json(addresses);
  } catch (err) {
    console.error("getAddressesByUser error:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// PATCH /addresses/:id
exports.updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      label,
      firstName,
      lastName,
      phone,
      line1,
      line2,
      city,
      postalCode,
      country,
      isDefault,
    } = req.body;

    const addr = await Address.findById(id);
    if (!addr) {
      return res.status(404).json({ message: "Adresse introuvable." });
    }

    if (typeof isDefault !== "undefined" && isDefault) {
      // Cette adresse devient default -> les autres ne le sont plus
      await Address.updateMany(
        { user: addr.user, _id: { $ne: addr._id } },
        { $set: { isDefault: false } }
      );
      addr.isDefault = true;
    } else if (typeof isDefault !== "undefined") {
      addr.isDefault = !!isDefault;
    }

    if (label !== undefined) addr.label = label;
    if (firstName !== undefined) addr.firstName = firstName;
    if (lastName !== undefined) addr.lastName = lastName;
    if (phone !== undefined) addr.phone = phone;
    if (line1 !== undefined) addr.line1 = line1;
    if (line2 !== undefined) addr.line2 = line2;
    if (city !== undefined) addr.city = city;
    if (postalCode !== undefined) addr.postalCode = postalCode;
    if (country !== undefined) addr.country = country;

    await addr.save();

    return res.status(200).json(addr);
  } catch (err) {
    console.error("updateAddress error:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// DELETE /addresses/:id
exports.deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const addr = await Address.findById(id);
    if (!addr) {
      return res.status(404).json({ message: "Adresse introuvable." });
    }

    const userId = addr.user;
    const wasDefault = addr.isDefault;

    await addr.deleteOne();

    // Si on a supprimé l'adresse par défaut, on peut en mettre une autre par défaut
    if (wasDefault) {
      const another = await Address.findOne({ user: userId }).sort({ createdAt: -1 });
      if (another) {
        another.isDefault = true;
        await another.save();
      }
    }

    return res.status(200).json({ message: "Adresse supprimée." });
  } catch (err) {
    console.error("deleteAddress error:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// PATCH /addresses/:id/default
exports.setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const addr = await Address.findById(id);
    if (!addr) {
      return res.status(404).json({ message: "Adresse introuvable." });
    }

    await Address.updateMany(
      { user: addr.user, _id: { $ne: addr._id } },
      { $set: { isDefault: false } }
    );

    addr.isDefault = true;
    await addr.save();

    return res.status(200).json(addr);
  } catch (err) {
    console.error("setDefaultAddress error:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};
