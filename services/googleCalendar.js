const { google } = require("googleapis");

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = "[clinic-ai-backend-euzh.onrender.com](https://clinic-ai-backend-euzh.onrender.com/oauth2callback)";

let refreshToken = process.env.GOOGLE_REFRESH_TOKEN || null;

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

  if (event.start && event.start.dateTime) {
    event.start.timeZone = "Europe/London";
  }
  if (event.end && event.end.dateTime) {
    event.end.timeZone = "Europe/London";
  }

  const response = await calendar.events.insert({
    calendarId: calendarId,
    requestBody: event,
  });

  return response.data;
}

async function getAvailability(calendarId, date) {
  const auth = getOAuthClient();
  auth.setCredentials({ refresh_token: getRefreshToken() });

  const calendar = google.calendar({ version: "v3", auth });

  const dayStart = new Date(`${date}T08:00:00+01:00`);
  const dayEnd = new Date(`${date}T18:00:00+01:00`);

  const response = await calendar.events.list({
    calendarId: calendarId,
    timeMin: dayStart.toISOString(),
    timeMax: dayEnd.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    timeZone: "Europe/London",
  });

  const booked = response.data.items.map((e) => ({
    start: e.start.dateTime,
    end: e.end.dateTime,
  }));

  // Generate all 1-hour slots from 8am to 5pm
  const allSlots = [];
  for (let hour = 8; hour <= 17; hour++) {
    const slotStart = new Date(`${date}T${String(hour).padStart(2, "0")}:00:00+01:00`);
    const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);

    const isTaken = booked.some((b) => {
      const bookedStart = new Date(b.start);
      const bookedEnd = new Date(b.end);
      return slotStart < bookedEnd && slotEnd > bookedStart;
    });

    if (!isTaken) {
      allSlots.push(
        slotStart.toLocaleTimeString("en-GB", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZone: "Europe/London",
        })
      );
    }
  }

  return allSlots;
}

async function cancelCalendarEvent(calendarId, eventId) {
  const auth = getOAuthClient();
  auth.setCredentials({ refresh_token: getRefreshToken() });

  const calendar = google.calendar({ version: "v3", auth });

  await calendar.events.delete({
    calendarId: calendarId,
    eventId: eventId,
  });
}

async function findEventByPatientAndDate(calendarId, patientName, date) {
  const auth = getOAuthClient();
  auth.setCredentials({ refresh_token: getRefreshToken() });

  const calendar = google.calendar({ version: "v3", auth });

  const dayStart = new Date(`${date}T00:00:00+01:00`);
  const dayEnd = new Date(`${date}T23:59:59+01:00`);

  const response = await calendar.events.list({
    calendarId: calendarId,
    timeMin: dayStart.toISOString(),
    timeMax: dayEnd.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    q: patientName,
  });

  return response.data.items;
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
