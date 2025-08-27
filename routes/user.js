const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const express = require("express");
const router = express.Router();
const User = require("../models/User");

// SIGNUP
router.post("/user/signup", async (req, res) => {
  try {
    const { username, email, password, newsletter } = req.body;
    if (!username || !email || !password || !newsletter) {
      return res.status(400).json({ message: "Missing parameters" });
    }
    const user = await User.findOne({ email });
    if (user) {
      return res.status(409).json({ message: "User already exists" });
    }
    const salt = uid2(64);
    const hash = SHA256(password + salt).toString(encBase64);
    const token = uid2(64);

    // Gestion de l'avatar si fourni
    let avatar = {};
    if (req.body.avatar_url) {
      avatar = {
        secure_url: req.body.avatar_url,
        public_id: req.body.avatar_public_id || "",
      };
    }

    const newUser = new User({
      email,
      account: {
        username,
        avatar: avatar,
      },
      newsletter,
      token,
      hash,
      salt,
    });
    await newUser.save();
    return res.status(201).json({
      _id: newUser._id,
      token: newUser.token,
      account: {
        username: newUser.account.username,
        avatar: newUser.account.avatar,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error });
  }
});

// LOGIN
router.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" }); // flou
    }
    const newHash = SHA256(password + user.salt).toString(encBase64);
    if (newHash !== user.hash) {
      return res.status(401).json({ message: "Unauthorized" }); // flou
    }
    return res.status(200).json({
      _id: user._id,
      token: user.token,
      account: {
        username: user.account.username,
        avatar: user.account.avatar,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error });
  }
});

module.exports = router;
