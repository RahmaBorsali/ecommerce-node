// ============ Imports =============
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const moment = require("moment-timezone");

const { CONNECTION_STRING } = require("./src/config/config");

const app = express();

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


// ============ Routes =============
// Pour l’instant juste une route de test
app.get("/", (req, res) => {
  res.send("API OPM PFE is running ✅");
});

// Plus tard tu ajouteras ici :
// const authRoute = require("./src/routes/authRoute");
// app.use("/auth", authRoute);
// etc...

module.exports = app;
