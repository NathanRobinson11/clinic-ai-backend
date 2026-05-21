const express = require("express");
const router = express.Router();
const { createCalendarEvent, getAvailability } = require("../services/googleCalendar");

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "primary";

// Book an appointment
router.post("/book", async (req, res) => {
  console.log("📥 REQUEST RECEIVED: POST /bookings/book");
  console.log("📦 BODY:", JSON.stringify(req.body));

  const { patientName, reason, dateTime, phone, clinicId } = req.body;

  if (!patientName || !dateTime) {
    return res.status(400).json({ success: false, message: "patientName and dateTime are required." });
  }

  try {
    // Build a 1-hour appointment slot
    const startTime = new Date(dateTime + "+01:00");
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

    const event = {
      summary: `${reason || "Appointment"} – ${patientName}`,
      description: `Patient: ${patientName}\nPhone: ${phone || "N/A"}\nReason: ${reason || "N/A"}`,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: "Europe/London",
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: "Europe/London",
      },
    };

    const created = await createCalendarEvent(CALENDAR_ID, event);

    console.log("✅ Booking created:", created.id);
    res.json({ success: true, message: "Appointment booked successfully.", eventId: created.id });

  } catch (err) {
    console.error("❌ Booking error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Check availability for a given date (format: YYYY-MM-DD)
router.get("/availability", async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ success: false, message: "date query parameter is required." });
  }

  try {
    const bookedSlots = await getAvailability(CALENDAR_ID, date);
    res.json({ success: true, date, bookedSlots });
  } catch (err) {
    console.error("❌ Availability error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
