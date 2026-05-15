const express = require("express");
const router = express.Router();

router.post("/ask", async (req, res) => {
  res.json({ answer: "FAQ placeholder answer." });
});

module.exports = router;
