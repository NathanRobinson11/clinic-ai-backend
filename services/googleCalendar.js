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

  // Force Europe/London so times are never shifted to UTC
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

  // Build start and end of the requested day in London time
  const dayStart = new Date(`${date}T08:00:00`);
  const dayEnd = new Date(`${date}T18:00:00`);

  const response = await calendar.events.list({
    calendarId: calendarId,
    timeMin: dayStart.toISOString(),
    timeMax: dayEnd.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    timeZone: "Europe/London",
  });

  const bookedSlots = response.data.items.map((e) => ({
    start: e.start.dateTime,
    end: e.end.dateTime,
    summary: e.summary,
  }));

  return bookedSlots;
}

module.exports = {
  getOAuthClient,
  saveRefreshToken,
  getRefreshToken,
  createCalendarEvent,
  getAvailability,
};
