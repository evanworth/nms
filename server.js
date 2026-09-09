const express = require("express");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;
app.get("/api/weather", async (req, res) => {
  const latitude = Number(req.query.latitude ?? 42.6687);
  const longitude = Number(req.query.longitude ?? -71.5884);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    res.status(400).json({ error: "Invalid weather location." });
    return;
  }

  const weatherUrl = new URL("https://api.open-meteo.com/v1/forecast");
  weatherUrl.searchParams.set("latitude", latitude);
  weatherUrl.searchParams.set("longitude", longitude);
  weatherUrl.searchParams.set("current", "temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m");
  weatherUrl.searchParams.set("temperature_unit", "fahrenheit");
  weatherUrl.searchParams.set("wind_speed_unit", "mph");
  weatherUrl.searchParams.set("timezone", String(req.query.timezone || "auto"));

  try {
    const response = await fetch(weatherUrl);
    if (!response.ok) {
      res.status(502).json({ error: "Weather service is temporarily unavailable." });
      return;
    }

    const current = (await response.json()).current;
    if (!current) throw new Error("Weather response is missing current conditions");

    res.json({
      temperature: current.temperature_2m,
      apparentTemperature: current.apparent_temperature,
      weatherCode: current.weather_code,
      windSpeed: current.wind_speed_10m,
      windDirection: current.wind_direction_10m
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
