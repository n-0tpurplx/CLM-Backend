const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();

// ===== CONFIG =====
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;

const GUILD_ID = "1508238624808894566";

// ===== HOME =====
app.get("/", (req, res) => {
  res.send("Backend alive");
});

// ===== LOGIN =====
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

// ===== CALLBACK (THIS IS THE FIXED PART) =====
app.get("/auth/discord/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send("No code received");

  try {
    // exchange code for token
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

    // get user
    const userRes = await axios.get(
      "https://discord.com/api/users/@me",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const username = userRes.data.username;

    // FINAL REDIRECT BACK TO YOUR SITE
    return res.redirect(
      `https://n-0tpurplx.github.io/Community-Manager-Lite/?auth=success&user=${encodeURIComponent(username)}`
    );

  } catch (err) {
    console.log(err.message);

    return res.redirect(
      `https://n-0tpurplx.github.io/Community-Manager-Lite/?auth=failed`
    );
  }
});

// ===== START =====
app.listen(3000, () => console.log("Running"));
