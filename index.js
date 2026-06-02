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
    return res.json({ success: false, error: "No command provided" });
  }

  try {
    // SEND TO ERLC API
    const response = await axios.post(
      "https://api.policeroleplay.community/v2/server/command",
      {
        command: command
      },
      {
        headers: {
          "server-key": ERLC_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    return res.json({
      success: true,
      data: response.data
    });

  } catch (err) {
    console.log(err.response?.data || err.message);

    return res.json({
      success: false,
      error: "ERLC API request failed"
    });
  }
});

// ===== START SERVER =====
app.listen(3000, () => console.log("Running"));
