const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Clinic AI Backend is running.");
});

app.use("/bookings", require("./routes/bookings"));
app.use("/sms", require("./routes/sms"));
app.use("/faq", require("./routes/faq"));
app.use("/reviews", require("./routes/reviews"));

app.listen(3000, () => console.log("Server running on port 3000"));
