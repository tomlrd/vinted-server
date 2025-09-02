const express = require("express");
const router = express.Router();
const isAuthenticated = require("../middlewares/isAuthenticated");

// Stripe sera passé depuis le fichier principal
let stripe;

// Fonction pour initialiser Stripe
const initStripe = (stripeInstance) => {
  stripe = stripeInstance;
};

// Route de paiement - nécessite une authentification
router.post("/payment", isAuthenticated, async (req, res) => {
  try {
    const { amount, currency = "eur", description, offerId } = req.body;

    // Validation des paramètres
    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: "Le montant est requis et doit être positif",
      });
    }

    // On crée une intention de paiement
    const paymentIntent = await stripe.paymentIntents.create({
      // Montant de la transaction (en centimes)
      amount: Math.round(amount * 100),
      // Devise de la transaction
      currency: currency.toLowerCase(),
      // Description du produit
      description: description || "Achat sur Vinted",
      // Métadonnées pour identifier l'offre
      metadata: {
        offerId: offerId || "",
        userId: req.user._id.toString(),
      },
    });

    // On renvoie les informations de l'intention de paiement au client
    res.json(paymentIntent);
  } catch (error) {
    console.error("Erreur lors de la création du paiement:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = { router, initStripe };
