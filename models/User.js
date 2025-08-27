const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  account: {
    username: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 20,
      unique: true,
    },
    avatar: {
      type: Object,
      default: {},
    },
  },
  newsletter: {
    type: Boolean,
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  hash: {
    type: String,
    required: true,
  },
  salt: {
    type: String,
    required: true,
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
