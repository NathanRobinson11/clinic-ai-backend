const { google } = require("googleapis");
const axios = require("axios");

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = "[clinic-ai-backend-euzh.onrender.com](https://clinic-ai-backend-euzh.onrender.com/oauth2callback)";

let refreshToken = process.env.GOOGLE_REFRESH_TOKEN || null;

function getOAuthClient() {
  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );
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
