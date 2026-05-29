const { google } = require("googleapis");

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = "[clinic-ai-backend-euzh.onrender.com](https://clinic-ai-backend-euzh.onrender.com/oauth2callback)";

let refreshToken = null;

function getOAuthClient() {
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

function saveRefreshToken(token) {
  refreshToken = token;
}

function getRefreshToken() {
  return refreshToken;
}

async function createCalendarEvent(calendarId, event) {
  const auth = getOAuthClient();
  auth.setCredentials({ refresh_token: getRefreshToken() });

  const calendar = google.calendar({ version: "v3", auth });

  const response = await calendar.events.insert({
    calendarId,
    requestBody: event,
  });

  return response.data;
}

async function getAvailability(calendarId, date, workingHours) {
  const auth = getOAuthClient();
  auth.setCredentials({ refresh_token: getRefreshToken() });

  const calendar = google.calendar({ version: "v3", auth });

  // Work out which day of the week this is
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const dateObj = new Date(date + "T00:00:00");
  const dayName = dayNames[dateObj.getDay()];

  // Check working hours for this day
  const dayHours = workingHours ? workingHours[dayName] : null;

  // If clinic is closed this day, return empty
  if (!dayHours) {
    console.log(`🚫 Clinic is closed on ${dayName}`);
    return [];
  }

  // Parse open and close hours
  const [openHour] = dayHours.open.split(":").map(Number);
  const [closeHour] = dayHours.close.split(":").map(Number);

  // Build list of possible slots within working hours
  const allSlots = [];
  for (let hour = openHour; hour < closeHour; hour++) {
    allSlots.push(hour);
  }

  // Check Google Calendar for existing events on this date
  const startOfDay = new Date(date + "T00:00:00+01:00");
  const endOfDay = new Date(date + "T23:59:59+01:00");

  const response = await calendar.events.list({
    calendarId,
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  const events = response.data.items || [];

  // Get booked hours
  const bookedHours = events.map((event) => {
    const start = new Date(event.start.dateTime || event.start.date);
    return start.getHours();
  });

  console.log("📅 Booked hours:", bookedHours);

  // Filter out booked slots
  const freeSlots = allSlots.filter((hour) => !bookedHours.includes(hour));

  // Format slots into spoken time
  const formatted = freeSlots.map((hour) => {
    const suffix = hour < 12 ? "am" : "pm";
    const display = hour <= 12 ? hour : hour - 12;
    return `${display}:00 ${suffix}`;
  });

  return formatted;
}

async function cancelCalendarEvent(calendarId, eventId) {
  const auth = getOAuthClient();
  auth.setCredentials({ refresh_token: getRefreshToken() });

  const calendar = google.calendar({ version: "v3", auth });

  await calendar.events.delete({
    calendarId,
    eventId,
  });
}

async function findEventByPatientAndDate(calendarId, patientName, date) {
  const auth = getOAuthClient();
  auth.setCredentials({ refresh_token: getRefreshToken() });

  const calendar = google.calendar({ version: "v3", auth });

  const startOfDay = new Date(date + "T00:00:00+01:00");
  const endOfDay = new Date(date + "T23:59:59+01:00");

  const response = await calendar.events.list({
    calendarId,
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  const events = response.data.items || [];

  return events.filter((event) =>
    event.summary && event.summary.toLowerCase().includes(patientName.toLowerCase())
  );
}

module.exports = {
  getOAuthClient,
  saveRefreshToken,
  getRefreshToken,
  createCalendarEvent,
  getAvailability,
  cancelCalendarEvent,
  findEventByPatientAndDate,
};
