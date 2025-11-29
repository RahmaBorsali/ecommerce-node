const Product = require("../models/productModel");

// CREATE
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      price,
      promoPrice,
      category,
      images,
      stock,
      tags,
      isFeatured,
    } = req.body;

    if (!name || !slug || !price || !category) {
      return res.status(400).json({ message: "name, slug, price et category sont obligatoires." });
    }

    const exists = await Product.findOne({ slug });
    if (exists) {
      return res.status(400).json({ message: "Un produit existe déjà avec ce slug." });
    }

    const product = await Product.create({
      name,
      slug,
      description,
      price,
      promoPrice,
      category,
      images,
      stock,
      tags,
      isFeatured,
    });

    return res.status(201).json(product);
  } catch (err) {
    console.error("createProduct error:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// GET ALL (avec filtres simples)
exports.getProducts = async (req, res) => {
  try {
    const { category, search, featured } = req.query;

    const filter = { isActive: true };

    if (category) {
      filter.category = category; // id de catégorie
    }

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    if (featured === "true") {
      filter.isFeatured = true;
    }

    const products = await Product.find(filter)
      .populate("category", "name slug")
      .sort({ createdAt: -1 });

    return res.status(200).json(products);
  } catch (err) {
    console.error("getProducts error:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// GET ONE BY ID
exports.getProductById = async (req, res) => {
  try {
    const prod = await Product.findById(req.params.id).populate("category", "name slug");
    if (!prod) {
      return res.status(404).json({ message: "Produit non trouvé" });
    }
    return res.status(200).json(prod);
  } catch (err) {
    console.error("getProductById error:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};


