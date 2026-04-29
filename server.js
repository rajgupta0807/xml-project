const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const app = express();
const SECRET = "mysecretkey";

// Middleware
app.use(helmet());
app.use(express.json());

app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
}));

// Home route
app.get("/", (req, res) => {
    res.send("Server is running 🚀");
});

// 🔐 LOGIN (username only)
app.post("/login", (req, res) => {
    try {
        const { username } = req.body || {};

        if (!username) {
            return res.status(400).send("Username required");
        }

        const token = jwt.sign({ username }, SECRET, { expiresIn: "1h" });

        res.json({ token });

    } catch (error) {
        console.log(error);
        res.status(500).send("Server error");
    }
});

// 🔐 Authentication middleware
function authenticate(req, res, next) {
    const token = req.headers["authorization"];

    if (!token) {
        return res.status(403).send("Token required");
    }

    try {
        const decoded = jwt.verify(token, SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).send("Invalid token");
    }
}

// 🌐 Protected route (external API)
app.get("/weather", authenticate, async (req, res) => {
    const city = req.query.city;

    if (!city) {
        return res.status(400).send("City is required");
    }

    try {
        const response = await axios.get(
            `https://wttr.in/${city}?format=j1`
        );

        res.json({
            user: req.user.username,
            weather: response.data
        });

    } catch (error) {
        console.log(error);
        res.status(500).send("Error fetching weather");
    }
});

// Start server
app.listen(3000, () => {
    console.log("Server running on port 3000");
});