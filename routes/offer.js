const express = require("express");
const router = express.Router();
const Offer = require("../models/Offer");
const isAuthenticated = require("../middlewares/isAuthenticated");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;

// GET ALL OFFERS WITH FILTERS AND PAGINATION
router.get("/offers", async (req, res) => {
  try {
    let skip = 0;
    let limit = 10;

    const filters = {};

    if (req.query.title) {
      filters.product_name = new RegExp(req.query.title, "i");
    }

    if (req.query.priceMax) {
      filters.product_price = { $lte: Number(req.query.priceMax) };
    }

    if (req.query.priceMin) {
      if (filters.product_price) {
        filters.product_price.$gte = Number(req.query.priceMin);
      } else {
        filters.product_price = { $gte: Number(req.query.priceMin) };
      }
    }
    const sortedObject = {};
    if (req.query.sort) {
      sortedObject.product_price = req.query.sort.replace("price-", "");
    }

    if (req.query.page) {
      skip = (req.query.page - 1) * limit;
    }

    const offers = await Offer.find(filters)
      .select("product_name product_price -_id")
      .sort(sortedObject)
      .limit(limit)
      .skip(skip);
    return res.status(200).json(offers);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// PUBLISH OFFER
router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      const { title, description, price, condition, city, brand, size, color } =
        req.body;
      const user = req.user;

      if (
        !title ||
        !description ||
        !price ||
        !condition ||
        !city ||
        !brand ||
        !size ||
        !color
      ) {
        return res.status(400).json({ message: "All fields are required" });
      }

      let product_image = {};
      if (req.files && req.files.picture) {
        const convertToBase64 = (file) => {
          return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
        };

        const result = await cloudinary.uploader.upload(
          convertToBase64(req.files.picture),
          {
            folder: "vinted/offers",
            resource_type: "auto",
          }
        );

        product_image = {
          secure_url: result.secure_url,
          public_id: result.public_id,
        };
      }

      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          { MARQUE: brand },
          { TAILLE: size },
          { ÉTAT: condition },
          { COULEUR: color },
          { EMPLACEMENT: city },
        ],
        product_image: product_image,
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
      return res.status(404).json({ message: "Offer not found" });
    }

    if (offer.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
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
    });

    if (!offer) {
      return res.status(404).json({ message: "This offer doesn't exist" });
    }

    return res.status(200).json(offer);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
