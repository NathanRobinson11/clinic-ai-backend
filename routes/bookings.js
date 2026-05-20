const express = require("express");
const router = express.Router();

const {
  createCalendarEvent,
  getAvailableSlots
} = require("../services/googleCalendar");

/**
 * BOOK APPOINTMENT
 */
router.post("/book", async (req, res) => {
  const { patientName, dateTime, reason, phone, clinicId } = req.body;

  try {
    console.log("Booking request received:", req.body);

    // Validate required fields
    if (!patientName || !dateTime || !reason || !phone) {
      return res.status(400).json({
        success: false,
        message: "Missing required booking information"
      });
    }

    const startDateTime = new Date(dateTime);

    if (isNaN(startDateTime.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid dateTime format received",
        received: dateTime
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

    return res.status(500).json({
      success: false,
      message: "Sorry, I couldn't complete the booking. Please try again."
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

/**
 * AVAILABILITY ENDPOINT (USED BY VAPI)
 */
router.post("/availability", async (req, res) => {
  const { date } = req.body;

  try {
    console.log("Availability request received:", req.body);

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required"
      });
    }

    const slots = await getAvailableSlots("primary", date);

    const formattedSlots = slots.map(slot =>
      new Date(slot).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/London"
      })
    );

    return res.json({
      success: true,
      slots: formattedSlots,
      message: "Available times retrieved"
    });

  } catch (err) {
    console.error("AVAILABILITY ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Could not fetch availability"
    });
  }
});

module.exports = router;
