// src/config/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ElectroSpace API',
      version: '1.0.0',
      description: 'Documentation de mon API Node (produits, panier, commandes, users, etc.)',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
  },
  // Tous les fichiers où tu vas mettre les commentaires Swagger
  apis: ['src/routes/*.js', 'src/controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
