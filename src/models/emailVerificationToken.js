const mongoose = require("mongoose");

const emailVerificationTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  token: { type: String, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24, // 24h -> TTL index automatique
  },
});

module.exports = mongoose.model(
  "EmailVerificationToken",
  emailVerificationTokenSchema
);
