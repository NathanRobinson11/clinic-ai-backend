const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { getOAuthClient } = require("./services/googleCalendar");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// DEBUG LOGGER
app.use((req, res, next) => {
  console.log("📡 REQUEST RECEIVED:", req.method, req.url);
  console.log("📦 BODY:", JSON.stringify(req.body));
  next();
});

// Home route
app.get("/", (req, res) => {
  res.send("Clinic AI Backend is running.");
});

// Google OAuth route
app.get("/auth/google", (req, res) => {
  const oauth2Client = getOAuthClient();

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["[googleapis.com](https://www.googleapis.com/auth/calendar)"],
    prompt: "consent",
  });

  res.redirect(url);
});

// Routes
app.use("/bookings", require("./routes/bookings"));
app.use("/sms", require("./routes/sms"));
app.use("/faq", require("./routes/faq"));
app.use("/reviews", require("./routes/reviews"));
app.use("/oauth2callback", require("./routes/oauth2callback"));

// Start server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
