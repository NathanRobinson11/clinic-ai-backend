const express = require("express");
const router = express.Router();
const { getOAuthClient, saveRefreshToken } = require("../services/googleCalendar");

router.get("/", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.send("Missing code");
  }

  try {
    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    saveRefreshToken(tokens.refresh_token);

    console.log("REFRESH TOKEN:", tokens.refresh_token);

    res.send("Google Calendar connected successfully. You can close this page.");
  } catch (e) {
    res.send("Error exchanging code: " + e.message);
  }
});

module.exports = router;
