const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const path = require("path");
const hbs = require("hbs");
const { z } = require("zod");

const app = express();

// Connexion à MongoDB
mongoose
  .connect("mongodb://localhost:27017/auth-mongo")
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });

// Définition du schéma utilisateur
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

// Configuration des chemins
const templatePath = path.join(__dirname, "../template");
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.static(path.join(__dirname, "../images")));
app.use(express.json());
app.set("view engine", "hbs");
app.set("views", templatePath);
app.use(express.urlencoded({ extended: false }));

// Middleware pour désactiver le cache
app.use((req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// Configuration de la session
app.use(
  session({
    secret: "votre_secret_de_session",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // Mettre à true si HTTPS est utilisé
  })
);

// Middleware d'authentification
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  } else {
    res.redirect("/");
  }
}

// Schéma de validation Zod pour l'inscription
const signupSchema = z.object({
  name: z.string().min(3).max(20),
  password: z.string().min(8),
});

// Schéma de validation Zod pour la connexion
const loginSchema = z.object({
  name: z.string().min(3, "Le nom d'utilisateur est obligatoire."),
  password: z.string().min(1, "Le mot de passe est obligatoire."),
});

// Routes
app.get("/", (req, res) => {
  res.render("login");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/signup", async (req, res) => {
  try {
    const validation = signupSchema.safeParse(req.body);

    if (!validation.success) {
      const errorMessage = validation.error.errors
        .map((err) => err.message)
        .join(", ");
      return res.status(400).send(`Erreur de validation: ${errorMessage}`);
    }

    const { name, password } = req.body;

    const existingUser = await User.findOne({ name });
    if (existingUser) {
      return res
        .status(400)
        .send("Nom d'utilisateur déjà pris, veuillez en choisir un autre.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, password: hashedPassword });
    await newUser.save();

    res.redirect("/");
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    res
      .status(500)
      .send(
        "Une erreur s'est produite lors de l'inscription. Veuillez réessayer."
      );
  }
});

app.post("/login", async (req, res) => {
  try {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      const errorMessage = validation.error.errors
        .map((err) => err.message)
        .join(", ");
      return res.status(400).send(`Erreur de validation: ${errorMessage}`);
    }

    const { name, password } = req.body;

    const user = await User.findOne({ name });

    if (user) {
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        req.session.user = user;
        res.redirect("/home");
      } else {
        res.status(400).send("Mot de passe incorrect");
      }
    } else {
      res.status(400).send("Utilisateur non trouvé");
    }
  } catch (error) {
    res.status(500).send("Erreur lors de la connexion");
  }
});

app.get("/home", isAuthenticated, (req, res) => {
  res.render("home");
});

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Erreur lors de la déconnexion");
    }
    res.clearCookie("connect.sid"); // Supprime le cookie de session
    res.redirect("/");
  });
});

// Démarrage du serveur
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
