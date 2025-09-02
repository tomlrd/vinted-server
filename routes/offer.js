const express = require("express");
const router = express.Router();
const Offer = require("../models/Offer");
const isAuthenticated = require("../middlewares/isAuthenticated");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const { createOfferValidators } = require("../validators/offerValidators");

// GET ALL OFFERS WITH FILTERS AND PAGINATION
router.get("/offers", async (req, res) => {
  try {
    console.log(req.query);
    let skip = 0;
    let limit = 10;

    const filters = {};

    // Filtres de recherche
    if (req.query.title) {
      filters.product_name = new RegExp(req.query.title, "i");
    }

    // Filtres de prix (gestion correcte des deux valeurs)
    if (req.query.priceMin || req.query.priceMax) {
      filters.product_price = {};
      if (req.query.priceMin) {
        filters.product_price.$gte = Number(req.query.priceMin);
      }
      if (req.query.priceMax) {
        filters.product_price.$lte = Number(req.query.priceMax);
      }
    }

    // Tri
    const sortedObject = {};
    if (req.query.sort) {
      sortedObject.product_price = req.query.sort.replace("price-", "");
    }

    // Pagination (correction de l'ordre)
    if (req.query.limit) {
      limit = Number(req.query.limit);
    }

    if (req.query.page) {
      skip = (req.query.page - 1) * limit;
    }

    // Compter le nombre total d'offres avec les filtres
    const count = await Offer.countDocuments(filters);
    console.log(count);

    const offers = await Offer.find(filters)
      .select("product_name product_price product_images _id product_details")
      .populate({
        path: "owner",
        select: "_id account.username account.avatar",
      })
      .sort(sortedObject)
      .limit(limit)
      .skip(skip);
    console.log(offers);

    return res.status(200).json({
      count: count,
      offers: offers,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// PUBLISH OFFER
router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  createOfferValidators,
  async (req, res) => {
    try {
      const { title, description, price, condition, city, brand, size, color } =
        req.body;
      const user = req.user;

      console.log(req.body);

      // Les validateurs express-validator s'occupent déjà de la validation

      let product_images = [];
      if (req.files && req.files.pictures) {
        // Gérer plusieurs images
        const files = Array.isArray(req.files.pictures)
          ? req.files.pictures
          : [req.files.pictures];

        for (const file of files) {
          const convertToBase64 = (file) => {
            return `data:${file.mimetype};base64,${file.data.toString(
              "base64"
            )}`;
          };

          const result = await cloudinary.uploader.upload(
            convertToBase64(file),
            {
              folder: "vinted/offers",
              resource_type: "auto",
            }
          );

          product_images.push({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        }
      }
      // Si pas d'images, product_images reste un tableau vide

      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: {
          product_size: size,
          product_condition: condition,
          product_brand: brand,
          product_color: color,
          product_city: city,
        },
        product_images: product_images,
        owner: user,
      });

      await newOffer.save();

      return res.status(201).json(newOffer);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

// DELETE OFFER
router.delete("/offer/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    const offer = await Offer.findById(id);
    if (!offer) {
      return res.status(404).json({ message: "Offre non trouvée" });
    }

    if (offer.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    await Offer.findByIdAndDelete(id);

    return res.status(200).json({ message: "Offer deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// GET OFFER BY ID
router.get("/offers/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const offer = await Offer.findById(id).populate({
      path: "owner",
      select: "_id account.username account.avatar",
    });

    if (!offer) {
      return res.status(404).json({ message: "This offer doesn't exist" });
    }

    return res.status(200).json(offer);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// GET OFFERS BY USER
router.get("/offers/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const offers = await Offer.find({ owner: userId })
      .select("product_name product_price product_images _id product_details")
      .populate({
        path: "owner",
        select: "_id account.username account.avatar",
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: offers.length,
      offers: offers,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
