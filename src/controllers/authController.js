const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const User = require("../models/userModel");
const EmailVerificationToken = require("../models/emailVerificationToken");
const emailQueue = require("../queues/emailQueue");
const jwt = require("jsonwebtoken");
const {
  SERVER_URL,
  FRONT_SERVER_URL,
  MAILBOXLAYER_API_KEY,
  ACCESS_TOKEN_PRIVATE_KEY,
  REFRESH_TOKEN_PRIVATE_KEY,
} = require("../config/config");

// ================== Vérif simple de l'email (rapide) ==================
function isEmailValid(email) {
  // Vérifie juste le format: truc@domaine.com
  const basicPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return basicPattern.test(email);
}

// ================== SIGNUP ==================
exports.signup = async (req, res) => {
  try {
    const { firstName, lastName, email, address, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        message: "Prénom, nom, email et mot de passe sont obligatoires.",
      });
    }

    // 1) Vérifier format email (rapide)
    if (!isEmailValid(email)) {
      return res
        .status(400)
        .json({ message: "Adresse e-mail invalide ou inexistante." });
    }

    // 2) Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Un compte existe déjà avec cet email." });
    }

    // 3) Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4) Créer l'utilisateur (non vérifié)
    const user = await User.create({
      firstName,
      lastName,
      email,
      address,
      password: hashedPassword,
      isVerified: false,
    });

    // 5) Générer un token de vérification
    const token = crypto.randomBytes(32).toString("hex");
    await EmailVerificationToken.create({
      userId: user._id,
      token,
    });

    const verificationUrl = `${SERVER_URL}/auth/verify-email?token=${token}`;
    console.log("🔗 Lien de vérification :", verificationUrl);

    // 6) Envoi du mail EN ARRIÈRE-PLAN (ne bloque pas la réponse)
    emailQueue
      .add({
        to: email,
        subject: "Vérifie ton adresse email",
        text: `Bonjour ${firstName},

Merci de t'être inscrit(e) sur notre site.

Clique sur ce lien pour vérifier ton adresse email et activer ton compte :
${verificationUrl}

Si tu n'es pas à l'origine de cette inscription, tu peux ignorer cet email.`,
        html: `
          <p>Bonjour ${firstName},</p>
          <p>Merci de t'être inscrit(e) sur notre site.</p>
          <p>Clique sur ce bouton pour vérifier ton adresse email et activer ton compte :</p>
          <p>
            <a href="${verificationUrl}" 
               style="display:inline-block;padding:10px 18px;background:#2563eb;color:#ffffff;
                      text-decoration:none;border-radius:6px;font-weight:bold;">
              Vérifier mon adresse email
            </a>
          </p>
          <p>Ou copie/colle ce lien dans ton navigateur :</p>
          <p><a href="${verificationUrl}">${verificationUrl}</a></p>
          <p>Si tu n'es pas à l'origine de cette inscription, tu peux ignorer cet email.</p>
        `,
      })
      .catch((err) => {
        console.error(
          "Erreur lors de l'envoi de l'email de vérification :",
          err
        );
      });

    // ✅ Réponse immédiate au frontend
    return res.status(200).json({
      message: "Compte créé. Vérifie ta boîte mail pour activer ton compte.",
    });
  } catch (error) {
    console.error("Erreur dans signup :", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// ================== VERIFY EMAIL ==================
exports.verifyEmail = async (req, res) => {
  const { token } = req.query;

  console.log("👉 Reçu token dans /auth/verify-email :", token);

  if (!token) {
    return res.status(400).send("Token de vérification manquant.");
  }

  try {
    const cleanToken = token.toString().trim();

    // 1) Retrouver le token
    const tokenDoc = await EmailVerificationToken.findOne({
      token: cleanToken,
    });
    console.log("🔎 tokenDoc trouvé :", tokenDoc);

    if (!tokenDoc) {
      return res.status(400).send("Token invalide ou expiré.");
    }

    // 2) Retrouver l'utilisateur
    const user = await User.findById(tokenDoc.userId);
    console.log("👤 user trouvé :", user);

    if (!user) {
      return res.status(400).send("Utilisateur introuvable.");
    }

    if (user.isVerified) {
      return res.status(400).send("Compte déjà vérifié.");
    }

    // 3) Marquer l'utilisateur comme vérifié
    user.isVerified = true;
    await user.save();

    // 4) Supprimer le token
    await tokenDoc.deleteOne();

    // 5) Mail de bienvenue
    emailQueue
      .add({
        to: user.email,
        subject: "Bienvenue sur notre site 🎉",
        text: `Bonjour ${user.firstName},

        Bienvenue sur notre site ! Ton compte est maintenant actif.

        Tu peux maintenant te connecter et profiter de tous nos services.`,
        html: `
          <p>Bonjour ${user.firstName},</p>
          <p>Bienvenue sur notre site ! Ton compte est maintenant <strong>actif</strong>.</p>
          <p>Tu peux maintenant te connecter et profiter de tous nos services.</p>
        `,
      })
      .catch((err) =>
        console.error("Erreur lors de l'envoi de l'email de bienvenue :", err)
      );

    // 6) Redirection vers le front (page "signin")
    if (FRONT_SERVER_URL) {
      return res.redirect(`${FRONT_SERVER_URL}/auth/signin`);
    }

    return res.send(
      "Email vérifié, votre compte est maintenant actif. Vous pouvez vous connecter."
    );
  } catch (error) {
    console.error("Erreur dans verifyEmail :", error);
    return res.status(500).send("Erreur serveur");
  }
  
};
// ================== LOGIN ==================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email et mot de passe sont obligatoires." });
    }

    // 1) Chercher l'utilisateur
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Email ou mot de passe incorrect." });
    }

    // 2) Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Email ou mot de passe incorrect." });
    }

    // 3) Vérifier que le compte est bien vérifié
    if (!user.isVerified) {
      return res.status(403).json({
        message:
          "Compte non vérifié. Merci de vérifier votre email avant de vous connecter.",
      });
    }

    // 4) Préparer le payload JWT (sans mot de passe)
    const payload = {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    // 5) Générer les tokens
    const accessToken = jwt.sign(payload, ACCESS_TOKEN_PRIVATE_KEY, {
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign(payload, REFRESH_TOKEN_PRIVATE_KEY, {
      expiresIn: "7d",
    });

    // 6) Nettoyer user avant de l'envoyer au front
    const userSafe = {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      address: user.address,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    };

    return res.status(200).json({
      message: "Connexion réussie.",
      user: userSafe,
      token: accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Erreur dans login :", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

