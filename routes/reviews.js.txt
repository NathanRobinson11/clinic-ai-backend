const express = require("express");
const router = express.Router();

router.post("/send", async (req, res) => {
  res.json({ reviewLink: "[example.com](https://example.com/review)" });
});

module.exports = router;
