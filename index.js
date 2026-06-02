const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();

// ===== CONFIG =====
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;

const GUILD_ID = "1508238624808894566";

// ===== HEALTH CHECK =====
app.get("/", (req, res) => {
  res.send("Backend alive");
});

// ===== STEP 1: REDIRECT TO DISCORD =====
app.get("/auth/discord", (req, res) => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "identify guilds"
  });

  res.redirect(
    `https://discord.com/api/oauth2/authorize?${params.toString()}`
  );
});

// ===== STEP 2: CALLBACK =====
app.get("/auth/discord/callback", async (req, res) => {
  const code = req.query.code;

  if (!code) return res.send("No code provided");

  try {
    // 1. Exchange code for token
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

    // 2. Get user info
    const userRes = await axios.get(
      "https://discord.com/api/users/@me",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // 3. Check guild membership
    const guildsRes = await axios.get(
      "https://discord.com/api/users/@me/guilds",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const inGuild = guildsRes.data.some(g => g.id === GUILD_ID);

    // ===== RESPONSE =====
    res.send(`
      <h1>Login Successful</h1>
      <p>User: ${userRes.data.username}</p>
      <p>Guild Access: ${inGuild ? "YES" : "NO"}</p>
      <p>Next step: role checking (bot needed)</p>
    `);

  } catch (err) {
    console.log(err.response?.data || err.message);
    res.send("Auth failed");
  }
});

// ===== START SERVER =====
app.listen(3000, () => {
  console.log("Server running");
});
