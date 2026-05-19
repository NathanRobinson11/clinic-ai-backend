const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { getOAuthClient } = require("./services/googleCalendar");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Clinic AI Backend is running.");
});

app.get("/auth/google", (req, res) => {
  const oauth2Client = getOAuthClient();
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["[googleapis.com](https://www.googleapis.com/auth/calendar)"],
    prompt: "consent"
  });
  res.redirect(url);
});

app.use("/bookings", require("./routes/bookings"));
app.use("/sms", require("./routes/sms"));
app.use("/faq", require("./routes/faq"));
app.use("/reviews", require("./routes/reviews"));
app.use("/oauth2callback", require("./routes/oauth2callback"));

app.listen(3000, () => console.log("Server running on port 3000"));
