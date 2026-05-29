const express = require("express");
const router = express.Router();
const {
  createCalendarEvent,
  getAvailability,
  cancelCalendarEvent,
  findEventByPatientAndDate,
} = require("../services/googleCalendar");
const supabase = require("../services/supabase");

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "primary";
const CLINIC_ID = process.env.CLINIC_ID;

// Book an appointment
router.post("/book", async (req, res) => {
  console.log("📡 REQUEST RECEIVED: POST /bookings/book");
  console.log("📦 BODY:", JSON.stringify(req.body));
  console.log("🏥 CLINIC_ID:", CLINIC_ID);

  const { patientName, reason, dateTime, phone } = req.body;

  if (!patientName || !dateTime) {
    return res.status(400).json({ success: false, message: "patientName and dateTime are required." });
  }

  try {
    const startTime = new Date(dateTime + "+01:00");
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

    // Check for double booking
    const { data: existingBookings, error: checkError } = await supabase
      .from("bookings")
      .select("id")
      .eq("clinic_id", CLINIC_ID)
      .eq("appointment_time", startTime.toISOString())
      .eq("status", "confirmed");

    if (checkError) {
      console.error("❌ Double booking check error:", JSON.stringify(checkError));
    }

    if (existingBookings && existingBookings.length > 0) {
      console.log("⚠️ Double booking prevented for:", startTime.toISOString());
      return res.json({
        success: false,
        message: "I'm sorry, that time slot has just been taken. Let me check what else we have available for you.",
      });
    }

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

    // Log booking to Supabase
    const { data, error } = await supabase.from("bookings").insert({
      clinic_id: CLINIC_ID,
      patient_name: patientName,
      phone: phone || null,
      reason: reason || null,
      appointment_time: startTime.toISOString(),
      google_event_id: created.id,
      status: "confirmed",
    });

    if (error) {
      console.error("❌ Supabase insert error:", JSON.stringify(error));
    } else {
      console.log("✅ Booking logged to Supabase, CLINIC_ID used:", CLINIC_ID);
    }

    res.json({
      success: true,
      message: `Brilliant — your appointment is confirmed for ${new Date(startTime).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/London" })} at ${new Date(startTime).toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Europe/London" })}. We look forward to seeing you!`,
      eventId: created.id,
    });
  } catch (err) {
    console.error("❌ Booking error:", err.message);
    res.status(500).json({ success: false, message: "Sorry, I wasn't able to complete the booking. Please try again." });
  }
});

// Check availability
router.post("/availability", async (req, res) => {
  console.log("📡 REQUEST RECEIVED: POST /bookings/availability");
  console.log("📦 BODY:", JSON.stringify(req.body));

  const { date } = req.body;
  console.log("📅 DATE RECEIVED:", date);

  if (!date) {
    return res.status(400).json({ success: false, result: "I'm sorry, I couldn't check availability right now. Please try again." });
  }

  try {
    // Fetch clinic working hours from Supabase
    const { data: clinic, error: clinicError } = await supabase
      .from("clinics")
      .select("working_hours")
      .eq("id", CLINIC_ID)
      .single();

    if (clinicError) {
      console.error("❌ Error fetching clinic hours:", JSON.stringify(clinicError));
    }

    const workingHours = clinic ? clinic.working_hours : null;
    console.log("🕐 Working hours:", JSON.stringify(workingHours));

    const availableSlots = await getAvailability(CALENDAR_ID, date, workingHours);
    console.log("✅ Available slots:", availableSlots);

    if (availableSlots.length === 0) {
      return res.json({ success: true, result: "Unfortunately we have no availability on that date. Would you like to try a different day?" });
    }

    const spoken = availableSlots.join(", ");
    const result = `We have availability at ${spoken}. Which would suit you best?`;
    console.log("📤 SENDING RESPONSE:", JSON.stringify({ success: true, result }));

    res.json({ success: true, result });
  } catch (err) {
    console.error("❌ Availability error:", err.message, err.stack);
    res.status(500).json({ success: false, result: "I'm sorry, I couldn't check availability right now. Please try again." });
  }
});

// Cancel an appointment
router.post("/cancel", async (req, res) => {
  console.log("📡 REQUEST RECEIVED: POST /bookings/cancel");
  console.log("📦 BODY:", JSON.stringify(req.body));

  const { patientName, date } = req.body;

  if (!patientName || !date) {
    return res.status(400).json({ success: false, message: "patientName and date are required." });
  }

  try {
    const events = await findEventByPatientAndDate(CALENDAR_ID, patientName, date);

    if (!events || events.length === 0) {
      return res.json({ success: false, message: `I couldn't find an appointment for ${patientName} on that date. Could you double check the details?` });
    }

    await cancelCalendarEvent(CALENDAR_ID, events[0].id);
    console.log("✅ Cancelled event:", events[0].id);

    // Update booking status in Supabase
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("google_event_id", events[0].id);

    if (error) {
      console.error("❌ Supabase update error:", JSON.stringify(error));
    } else {
      console.log("✅ Booking status updated in Supabase");
    }

    res.json({ success: true, message: `Done — the appointment for ${patientName} has been cancelled. If you'd like to rebook, just let me know.` });
  } catch (err) {
    console.error("❌ Cancellation error:", err.message, err.stack);
    res.status(500).json({ success: false, message: "Sorry, I wasn't able to cancel that appointment. Please try again." });
  }
});

module.exports = router;
