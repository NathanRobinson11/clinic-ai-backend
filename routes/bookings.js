const express = require("express");
const router = express.Router();

const { createCalendarEvent } = require("../services/googleCalendar");

/**
 * BOOK APPOINTMENT
 */
router.post("/book", async (req, res) => {
  const { patientName, dateTime, reason, phone, clinicId } = req.body;

  console.log("📥 Booking request received:", req.body);

  try {
    /**
     * -----------------------------
     * VALIDATION (CRITICAL)
     * -----------------------------
     */
    if (!patientName || !dateTime || !reason || !phone) {
      return res.json({
        success: false,
        message: "Missing required booking details. Please provide all information."
      });
    }

    /**
     * -----------------------------
     * DATE PARSING (TIMEZONE SAFE)
     * -----------------------------
     * Vapi sends ISO string → we lock it to correct interpretation
     */
    const startDateTime = new Date(dateTime);

    if (isNaN(startDateTime.getTime())) {
      return res.json({
        success: false,
        message: "I couldn't understand the appointment time. Please try again."
      });
    }

    const endDateTime = new Date(startDateTime.getTime() + 30 * 60000);

    /**
     * -----------------------------
     * GOOGLE CALENDAR EVENT
     * -----------------------------
     */
    const event = {
      summary: `Appointment: ${patientName}`,
      description: `${reason} | Phone: ${phone}`,
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

    /**
     * -----------------------------
     * HUMAN READABLE RESPONSE (VAPI SPEECH)
     * -----------------------------
     */
    const spokenDate = startDateTime.toLocaleString("en-GB", {
      timeZone: "Europe/London",
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit"
    });

    console.log("📅 Calendar event created:", result.id);

    return res.json({
      success: true,
      message: `Perfect — your appointment is confirmed for ${spokenDate}. We look forward to seeing you.`,
      eventId: result.id
    });

  } catch (error) {
    console.error("❌ Booking error:", error);

    return res.json({
      success: false,
      message: "Sorry — I couldn't complete your booking. Please try again."
    });
  }
});

/**
 * CANCEL (placeholder for now)
 */
router.post("/cancel", async (req, res) => {
  return res.json({
    success: true,
    message: "Your cancellation request has been received."
  });
});

module.exports = router;
