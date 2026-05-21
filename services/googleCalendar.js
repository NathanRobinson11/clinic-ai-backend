const { google } = require("googleapis");
const axios = require("axios");

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = "[clinic-ai-backend-euzh.onrender.com](https://clinic-ai-backend-euzh.onrender.com/oauth2callback)";

let refreshToken = null;

function getOAuthClient() {
  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );
}

// Store refresh token globally (later we put this in DB)
function saveRefreshToken(token) {
  refreshToken = token;
}

// Retrieve refresh token
function getRefreshToken() {
  return refreshToken;
}

async function createCalendarEvent(calendarId, event) {
  const auth = getOAuthClient();
  auth.setCredentials({ refresh_token: getRefreshToken() });

  const calendar = google.calendar({ version: "v3", auth });

  // Force Europe/London timezone on start and end times
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

module.exports = {
  getOAuthClient,
  saveRefreshToken,
  getRefreshToken,
  createCalendarEvent,
};
