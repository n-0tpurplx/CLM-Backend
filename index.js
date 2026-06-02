const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Backend alive");
});

// STEP 1: login redirect (temporary stub)
app.get("/auth/discord", (req, res) => {
  res.send("Login route works (next we add Discord redirect)");
});

// STEP 2: callback (THIS FIXES YOUR ERROR)
app.get("/auth/discord/callback", (req, res) => {
  res.send("Callback reached successfully 🎉");
});

app.listen(3000, () => {
  console.log("Server running");
});
