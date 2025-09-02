const { body } = require("express-validator");
const {
  handleValidationErrors,
} = require("../middlewares/validationMiddleware");

// Validateurs pour la création d'offre
const createOfferValidators = [
  body("title")
    .isLength({ min: 1, max: 50 })
    .withMessage("Le titre doit contenir entre 1 et 50 caractères")
    .trim(),
  body("description")
    .isLength({ min: 10, max: 500 })
    .withMessage("La description doit contenir entre 10 et 500 caractères")
    .trim(),
  body("price")
    .isFloat({ min: 0, max: 500 })
    .withMessage("Le prix doit être un nombre positif inférieur à 500"),
  body("size")
    .isLength({ min: 1, max: 20 })
    .withMessage("La taille doit contenir entre 1 et 20 caractères")
    .trim(),
  body("condition")
    .isLength({ min: 1, max: 50 })
    .withMessage("L'état doit contenir entre 1 et 50 caractères")
    .trim(),
  body("brand")
    .isLength({ min: 1, max: 50 })
    .withMessage("La marque doit contenir entre 1 et 50 caractères")
    .trim(),
  body("color")
    .isLength({ min: 1, max: 30 })
    .withMessage("La couleur doit contenir entre 1 et 30 caractères")
    .trim(),
  body("city")
    .isLength({ min: 1, max: 50 })
    .withMessage("La ville doit contenir entre 1 et 50 caractères")
    .trim(),
  handleValidationErrors,
];

module.exports = {
  createOfferValidators,
};
