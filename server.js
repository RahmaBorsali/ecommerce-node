// server.js

const http = require("http");
const app = require("./app");
const { PORT } = require("./src/config/config");

// Création du serveur HTTP à partir de l'app Express
const server = http.createServer(app);

// Lancement du serveur
const port = PORT || 3000;
server.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
