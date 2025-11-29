const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");

// /categories
router.post("/", categoryController.createCategory);       
router.get("/", categoryController.getCategories);      
router.get("/:id", categoryController.getCategoryById);   


module.exports = router;
