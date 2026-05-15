const express = require("express");
const router = express.Router();

router.post("/send", async (req, res) => {
  res.json({ success: true, message: "SMS endpoint placeholder." });
});

module.exports = router;
