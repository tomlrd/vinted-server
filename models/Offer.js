const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    product_name: {
      type: String,
      required: true,
      minLength: 1,
      maxLength: 50,
      trim: true,
    },
    product_description: {
      type: String,
      required: true,
      minLength: 10,
      maxLength: 500,
      trim: true,
    },
    product_price: {
      type: Number,
      required: true,
      min: 0,
      max: 100000,
    },
    product_details: {
      type: Array,
      default: [],
    },
    product_image: {
      type: Object,
      default: {},
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
);

const Offer = mongoose.model("Offer", offerSchema);

module.exports = Offer;
