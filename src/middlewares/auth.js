const jwt = require("jsonwebtoken");
const { ACCESS_TOKEN_PRIVATE_KEY } = require("../config/config");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Le token doit être sous forme "Bearer TOKEN"
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Accès refusé. Token manquant.", code: "NO_TOKEN" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_PRIVATE_KEY);

    // Ajouter l'utilisateur décodé à req.user
    req.user = decoded;

    return next();
  } catch (err) {
    console.error("Erreur token :", err);

    if (err.name === "TokenExpiredError") {
      // 👇 Très important : code spécial pour le front
      return res.status(401).json({
        message: "Token expiré.",
        code: "TOKEN_EXPIRED",
      });
    }

    return res.status(401).json({
      message: "Token invalide.",
      code: "INVALID_TOKEN",
    });
  }
};
