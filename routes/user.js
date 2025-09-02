const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const isAuthenticated = require("../middlewares/isAuthenticated");
const {
  signupValidators,
  loginValidators,
} = require("../validators/authValidators");

// SIGNUP
router.post("/user/signup", signupValidators, async (req, res) => {
  try {
    const { username, email, password, newsletter } = req.body;
    console.log(req.body);

    // Les validateurs express-validator s'occupent déjà de la validation
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
router.post("/user/login", loginValidators, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ message: "Email ou mot de passe incorrect" }); // flou
    }
    const newHash = SHA256(password + user.salt).toString(encBase64);
    if (newHash !== user.hash) {
      return res
        .status(401)
        .json({ message: "Email ou mot de passe incorrect" }); // flou
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

// GET CURRENT USER PROFILE
router.get("/user/profile", isAuthenticated, async (req, res) => {
  try {
    console.log("req.user:", req.user);
    console.log("req.user._id:", req.user._id);

    const user = await User.findById(req.user._id).select("-hash -salt -token");
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error("Erreur dans /user/profile:", error);
    return res.status(500).json({ message: error.message });
  }
});

// GET USER BY ID
router.get("/user/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-hash -salt -token");

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
