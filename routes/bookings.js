const express = require("express");
const router = express.Router();
const { createCalendarEvent } = require("../services/googleCalendar");

router.post("/book", async (req, res) => {
  const { patientName, dateTime, reason, phone, clinicId } = req.body;

  try {
    console.log("Booking request received:", req.body);

    // Validate required fields
    if (!patientName || !dateTime || !reason || !phone) {
      return res.json({
        success: false,
        message: "Missing required booking information. Please try again."
      });
    }

    const startDateTime = new Date(dateTime);

    if (isNaN(startDateTime.getTime())) {
      return res.json({
        success: false,
        message: "I couldn't understand the appointment time. Please try again."
      });
    }

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
    console.log("Calendar event created:", result.id);

    // HUMAN-FRIENDLY speech format (THIS fixes your weird speech issue)
    const spokenDate = startDateTime.toLocaleString("en-GB", {
      timeZone: "Europe/London",
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });

    return res.json({
      success: true,
      message: `Perfect — your appointment is confirmed for ${spokenDate}. We look forward to seeing you.`,
      eventId: result.id
    });

  } catch (e) {
    console.log("Booking error:", e.message);

    return res.json({
      success: false,
      message: "Sorry — I wasn't able to book that appointment. Please try again."
    });
  }
});

router.post("/cancel", async (req, res) => {
  return res.json({
    success: true,
    message: "Your cancellation request has been received."
  });
});

module.exports = router;
