const express = require("express");
const router = express.Router();
const { createCalendarEvent } = require("../services/googleCalendar");

router.post("/book", async (req, res) => {

  console.log("=== BOOKING REQUEST RECEIVED ===");
  console.log(req.body);

  const { patientName, dateTime, reason, phone } = req.body;

  try {

    console.log("Creating appointment for:", patientName);
    console.log("DateTime:", dateTime);

    // Convert incoming date
    const startDateTime = new Date(dateTime);

    // Add 30 minutes for appointment end
    const endDateTime = new Date(
      startDateTime.getTime() + 30 * 60000
    );

    // Google Calendar event
    const event = {
      summary: `Appointment: ${patientName || "Unknown Patient"}`,

      description:
        `Reason: ${reason || "Audiology appointment"}\n` +
        `Phone: ${phone || "Not provided"}`,

      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: "Europe/London",
      },

      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: "Europe/London",
      },
    };

    console.log("Sending event to Google Calendar...");
    console.log(event);

    // Create calendar event
    const result = await createCalendarEvent(
      "primary",
      event
    );

    console.log("=== GOOGLE SUCCESS ===");
    console.log(result);

    res.json({
      success: true,
      message: "Appointment booked successfully!",
      eventId: result.id,
    });

  } catch (e) {

    console.log("=== GOOGLE ERROR ===");
    console.log(e);

    res.status(500).json({
      success: false,
      message: "Failed to book appointment",
      error: e.message,
    });
  }
});

// Placeholder cancel endpoint
router.post("/cancel", async (req, res) => {

  console.log("=== CANCEL REQUEST ===");
  console.log(req.body);

  res.json({
    success: true,
    message: "Cancellation endpoint placeholder.",
  });
});

module.exports = router;
