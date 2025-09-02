const express = require("express");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");
const dotenv = require("dotenv");

// Charger les variables d'environnement AVANT d'initialiser Stripe
dotenv.config();

const stripe = require("stripe")(process.env.STRIPE_API_SECRET);

// Vérifier que Stripe est correctement configuré
if (!process.env.STRIPE_API_SECRET) {
  console.error(
    "❌ ERREUR: STRIPE_API_SECRET n'est pas configuré dans les variables d'environnement"
  );
  process.exit(1);
}
console.log("✅ Stripe configuré avec succès");

const app = express();

// Configuration CORS
app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const userRoutes = require("./routes/user");
    const offerRoutes = require("./routes/offer");
    const { router: paymentRoutes, initStripe } = require("./routes/payment");

    // Initialiser Stripe dans la route de paiement
    initStripe(stripe);

    app.use(userRoutes);
    app.use(offerRoutes);
    app.use(paymentRoutes);

    app.get("/", (req, res) => {
      try {
        return res.status(200).json("Bienvenue sur Vinted");
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }
    });

    app.all(/.*/, (req, res) => {
      return res.status(404).json({ message: "Not found" });
    });

    app.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("server error : ", error.message);
    process.exit(1);
  }
};

startServer();
