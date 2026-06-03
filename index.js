
const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// ===== CONFIG =====
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;

const ERLC_API_KEY = process.env.ERLC_API_KEY;

// ===== HOME =====
app.get("/", (req, res) => {
  res.send("Backend running");
});

// ===== DISCORD LOGIN =====
app.get("/auth/discord", (req, res) => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "identify guilds",
  });

  res.redirect(
    `https://discord.com/oauth2/authorize?${params.toString()}`
  );
});

// ===== CALLBACK =====
app.get("/auth/discord/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send("No code");

  try {
    const tokenRes = await axios.post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken = tokenRes.data.access_token;

    const userRes = await axios.get(
      "https://discord.com/api/users/@me",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return res.redirect(
      `https://n-0tpurplx.github.io/Community-Manager-Lite/?auth=success&user=${encodeURIComponent(userRes.data.username)}`
    );

  } catch (err) {
    console.log(err.message);

    return res.redirect(
      `https://n-0tpurplx.github.io/Community-Manager-Lite/?auth=failed`
    );
  }
});

// ===== COMMAND ROUTE (THIS IS THE IMPORTANT PART) =====
app.post("/command", async (req, res) => {
  const { command } = req.body;

  if (!command) {
    return res.status(400).json({
      error: "No command provided"
    });
  }

  try {
    const response = await fetch(
      "https://api.erlc.gg/v2/server/command",
      {
        method: "POST",
        headers: {
          "server-key": process.env.ERLC_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          command: command
        })
      }
    );

    const data = await response.json();

    console.log("ERLC RESPONSE:", data);

    res.json(data);

  } catch (err) {
    console.error("ERLC ERROR:", err);

    res.status(500).json({
      error: "Failed to send command"
    });
  }
});
// ===== START SERVER =====
app.listen(3000, () => console.log("Running"));
