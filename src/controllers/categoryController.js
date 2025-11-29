const Category = require("../models/categoryModel");

// CREATE
exports.createCategory = async (req, res) => {
  try {
    const { name, slug, description } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ message: "name et slug sont obligatoires." });
    }

    const exists = await Category.findOne({ $or: [{ name }, { slug }] });
    if (exists) {
      return res.status(400).json({ message: "Cette catégorie existe déjà (name ou slug)." });
    }

    const category = await Category.create({ name, slug, description });
    return res.status(201).json(category);
  } catch (err) {
    console.error("createCategory error:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// GET ALL
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    return res.status(200).json(categories);
  } catch (err) {
    console.error("getCategories error:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// GET ONE BY ID
exports.getCategoryById = async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) {
      return res.status(404).json({ message: "Catégorie non trouvée" });
    }
    return res.status(200).json(cat);
  } catch (err) {
    console.error("getCategoryById error:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

