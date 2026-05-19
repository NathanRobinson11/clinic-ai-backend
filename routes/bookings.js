const express = require("express");
const router = express.Router();
const { createCalendarEvent } = require("../services/googleCalendar");

router.post("/book", async (req, res) => {
  const { patientName, dateTime, reason, phone } = req.body;

  try {
    const startDateTime = new Date(dateTime);
    const endDateTime = new Date(startDateTime.getTime() + 30 * 60000);

    const event = {
      summary: `Appointment: ${patientName}`,
      description: reason || "Audiology appointment",
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: "Europe/London",
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: "Europe/London",
      },
    };

    const result = await createCalendarEvent("primary", event);

    res.json({ success: true, message: "Appointment booked!", eventId: result.id });
  } catch (e) {
    res.json({ success: false, message: "Failed to book: " + e.message });
  }
});

router.post("/cancel", async (req, res) => {
  res.json({ success: true, message: "Cancellation endpoint placeholder." });
});

module.exports = router;
