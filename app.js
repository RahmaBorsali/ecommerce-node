// ============ Imports =============
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const moment = require("moment-timezone");

const { CONNECTION_STRING } = require("./src/config/config");

const app = express();
const authRoute = require("./src/routes/authRoute");
const categoryRoute = require("./src/routes/categoryRoute");
const productRoute = require("./src/routes/productRoute");
const orderRoute = require("./src/routes/orderRoute");
const couponRoute = require("./src/routes/couponRoute");
const wishlistRoute = require("./src/routes/wishlistRoute");  
const addressRoute = require("./src/routes/addressRoute");
const reviewRoute = require("./src/routes/reviewRoute");
const cartRoute = require("./src/routes/cartRoute");
const userRoute = require("./src/routes/userRoute");

const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
// ============ Middlewares généraux =============
app.use(cors({ origin: "http://localhost:4200", credentials: true }));

// Si tu veux déjà prévoir des dossiers statiques (optionnel)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/pdfs", express.static(path.join(__dirname, "pdfs")));
app.use("/word", express.static(path.join(__dirname, "word")));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ============ Timezone par défaut =============
moment.tz.setDefault("Africa/Tunis");

// ============ MongoDB connection =============
mongoose.set("strictQuery", true);

mongoose
  .connect(CONNECTION_STRING)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.log("❌ MongoDB connection error:", err));

// ============ Swagger / OpenAPI =============
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Ecommerce API",
      version: "1.0.0",
      description: "API de ton site e-commerce (auth, produits, commandes, etc.)",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
  },
  // tous tes fichiers de routes Express
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// URL de la doc : http://localhost:3000/api-docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// ============ Routes =============
app.use("/auth", authRoute);
app.use("/categories", categoryRoute);
app.use("/products", productRoute);
app.use("/orders", orderRoute);
app.use("/coupons", couponRoute);
app.use("/wishlist", wishlistRoute);                          
app.use("/addresses", addressRoute);
app.use("/reviews", reviewRoute);
app.use("/cart", cartRoute);
app.use("/users", userRoute);


module.exports = app;
