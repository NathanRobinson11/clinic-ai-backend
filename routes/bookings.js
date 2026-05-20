const express = require("express");
const router = express.Router();

const { createCalendarEvent } = require("../services/googleCalendar");

/**
 * BOOK APPOINTMENT
 */
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

    // IMPORTANT: prevent timezone shift issues
    const startDateTime = new Date(dateTime);

    if (isNaN(startDateTime.getTime())) {
      return res.json({
        success: false,
        message: "Invalid appointment time received. Please try again."
      });
    }

    const endDateTime = new Date(startDateTime.getTime() + 30 * 60000);

    const event = {
      summary: `Appointment: ${patientName}`,
      description: reason || "Audiology appointment",
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: "Europe/London"
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: "Europe/London"
      }
    };

    const result = await createCalendarEvent("primary", event);

    if (!result || !result.id) {
      throw new Error("Calendar event creation failed");
    }

    // HUMAN-FRIENDLY FORMAT (IMPORTANT FOR VAPI SPEECH)
    const spokenDate = startDateTime.toLocaleString("en-GB", {
      timeZone: "Europe/London",
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit"
    });

    return res.json({
      success: true,
      message: `Perfect — your appointment is confirmed for ${spokenDate}. We look forward to seeing you.`,
      eventId: result.id
    });

  } catch (err) {
    console.error("BOOKING ERROR:", err);

    return res.json({
      success: false,
      message: "Sorry — I couldn't complete your booking. Please try again."
    });
  }
});

/**
 * CANCEL (placeholder)
 */
router.post("/cancel", async (req, res) => {
  return res.json({
    success: true,
    message: "Your cancellation request has been received."
  });
});

module.exports = router;
