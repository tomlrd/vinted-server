const { body } = require("express-validator");
const {
  handleValidationErrors,
} = require("../middlewares/validationMiddleware");

// Validateurs pour l'inscription
const signupValidators = [
  body("email")
    .isEmail()
    .withMessage("Format d'email invalide")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Le mot de passe doit contenir au moins 6 caractères"),
  body("username")
    .isLength({ min: 3, max: 20 })
    .withMessage("Le nom d'utilisateur doit contenir entre 3 et 20 caractères")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage(
      "Le nom d'utilisateur ne peut contenir que des lettres, chiffres et underscores"
    ),
  body("newsletter")
    .isBoolean()
    .withMessage("La newsletter doit être un booléen"),
  handleValidationErrors,
];

// Validateurs pour la connexion
const loginValidators = [
  body("email")
    .isEmail()
    .withMessage("Format d'email invalide")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Le mot de passe est requis"),
  handleValidationErrors,
];

module.exports = {
  signupValidators,
  loginValidators,
};
