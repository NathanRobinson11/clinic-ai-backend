const express = require("express");
const router = express.Router();

router.post("/book", async (req, res) => {
  res.json({ success: true, message: "Booking endpoint placeholder." });
});

router.post("/cancel", async (req, res) => {
  res.json({ success: true, message: "Cancellation endpoint placeholder." });
});

module.exports = router;
