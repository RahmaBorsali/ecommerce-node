// src/queues/emailQueue.js
const Queue = require("bull");
const nodemailer = require("nodemailer");
const {
  MAILING_EMAIL,
  MAILING_PASSWORD,
  MAILING_HOST,
  MAILING_PORT,
} = require("../config/config");

// Connexion à Redis (localhost:6379 par défaut)
const emailQueue = new Queue("emailQueue", {
  redis: { host: "127.0.0.1", port: 6379 },
});

// Transporter Nodemailer
const transporter = nodemailer.createTransport({
  host: MAILING_HOST,
  port: Number(MAILING_PORT),
  secure: Number(MAILING_PORT) === 465, // true pour 465
  auth: {
    user: MAILING_EMAIL,
    pass: MAILING_PASSWORD,
  },
});

// Traitement des mails dans la queue
emailQueue.process(async (job, done) => {
  try {
    const { to, subject, text, html } = job.data;

    // Log pour vérifier ce qu'on envoie
    console.log("📧 Envoi email vers :", to);
    console.log("📧 Sujet :", subject);
    console.log("📧 A un text ?", !!text, " / A un html ?", !!html);

    await transporter.sendMail({
      from: `"Ecommerce App" <${MAILING_EMAIL}>`,
      to,
      subject,
      text,
      html,
    });

    done();
  } catch (err) {
    console.error("Erreur lors de l'envoi du mail :", err);
    done(err);
  }
});

module.exports = emailQueue;
