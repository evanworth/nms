const express = require("express");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;
const weatherApiKey = process.env.OPENWEATHER_API_KEY;

app.get("/api/weather", async (_req, res) => {
  if (!weatherApiKey) {
    res.status(500).json({ error: "Weather service is not configured." });
    return;
  }

  const weatherUrl = new URL("https://api.openweathermap.org/data/2.5/weather");
  weatherUrl.searchParams.set("q", "Pepperell,MA,US");
  weatherUrl.searchParams.set("units", "imperial");
  weatherUrl.searchParams.set("appid", weatherApiKey);

  try {
    const response = await fetch(weatherUrl);
    if (!response.ok) {
      res.status(502).json({ error: "Weather service is temporarily unavailable." });
      return;
    }

    const data = await response.json();
    const weather = data.weather && data.weather.length > 0 ? data.weather[0] : { description: "Unknown" };

    res.json({
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      conditions: weather.description.replace(/\b\w/g, (c) => c.toUpperCase()),
      windSpeed: Math.round(data.wind.speed),
      windDeg: data.wind.deg
    });
  } catch (_error) {
    res.status(502).json({ error: "Weather service is temporarily unavailable." });
  }
});

app.use(express.static(path.join(__dirname)));

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(`NextBlock running on http://localhost:${port}`);
});
