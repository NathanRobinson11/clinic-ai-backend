const { google } = require("googleapis");

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

// FIXED redirect URI (your previous version was broken)
const redirectUri = "https://clinic-ai-backend-euzh.onrender.com/oauth2callback";

let refreshToken = process.env.GOOGLE_REFRESH_TOKEN || null;

/**
 * Create OAuth client
 */
function getOAuthClient() {
  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );
}

/**
 * Save refresh token dynamically (if needed later)
 */
function saveRefreshToken(token) {
  refreshToken = token;
}

/**
 * Get stored refresh token
 */
function getRefreshToken() {
  return refreshToken;
}

/**
 * Authenticate Google Calendar client
 */
function getCalendarClient() {
  const auth = getOAuthClient();
  auth.setCredentials({ refresh_token: getRefreshToken() });

  return google.calendar({ version: "v3", auth });
}

/**
 * Create calendar event (BOOKING)
 */
async function createCalendarEvent(calendarId, event) {
  const calendar = getCalendarClient();

  const response = await calendar.events.insert({
    calendarId,
    requestBody: event,
  });

  return response.data;
}

/**
 * Get events in a time range (USED FOR AVAILABILITY)
 */
async function getEvents(calendarId, timeMin, timeMax) {
  const calendar = getCalendarClient();

  const response = await calendar.events.list({
    calendarId,
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: "startTime",
  });

  return response.data.items || [];
}

/**
 * Check availability and generate free 30-min slots
 */
async function getAvailableSlots(calendarId, date) {
  const startOfDay = new Date(`${date}T08:00:00`);
  const endOfDay = new Date(`${date}T18:00:00`);

  const events = await getEvents(
    calendarId,
    startOfDay.toISOString(),
    endOfDay.toISOString()
  );

  const busySlots = events.map(event => ({
    start: new Date(event.start.dateTime),
    end: new Date(event.end.dateTime),
  }));

  const slots = [];
  const slot = new Date(startOfDay);

  while (slot < endOfDay) {
    const slotEnd = new Date(slot.getTime() + 30 * 60000);

    const isConflict = busySlots.some(busy =>
      busy.start < slotEnd && busy.end > slot
    );

    if (!isConflict) {
      slots.push(slot.toISOString());
    }

    slot.setMinutes(slot.getMinutes() + 30);
  }

  return slots.slice(0, 6);
}

module.exports = {
  getOAuthClient,
  saveRefreshToken,
  getRefreshToken,
  createCalendarEvent,
  getEvents,
  getAvailableSlots
};
