const schedules = {
  mw: [
    ["1", "08:10", "08:40"],
    ["2", "08:40", "09:30"],
    ["3", "09:30", "10:20"],
    ["4", "10:20", "11:10"],
    ["5", "11:10", "12:00"],
    ["6", "12:00", "12:50"],
    ["7", "12:50", "13:40"],
    ["8", "13:40", "14:25"]
  ],
  ttf: [
    ["1", "08:05", "09:00"],
    ["2", "09:00", "09:55"],
    ["3", "09:55", "10:50"],
    ["4", "10:50", "11:45"],
    ["5", "11:45", "12:40"],
    ["6", "12:40", "13:35"],
    ["7", "13:35", "14:25"]
  ]
};

const lunches = [
  { grade: 5, start: 650, end: 680 },
  { grade: 6, start: 682, end: 712 },
  { grade: 7, start: 714, end: 744 },
  { grade: 8, start: 746, end: 776 }
];

function formatTime(hours, minutes) {
  const ampm = hours >= 12 ? "PM" : "AM";
  const hr = hours % 12 || 12;
  return `${hr}:${minutes.toString().padStart(2, "0")} ${ampm}`;
}

function updateClock() {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const day = now.getDay();

  document.getElementById("clock").textContent = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });

  if (day === 0 || day === 6) {
    document.getElementById("dayType").textContent = "Weekend Schedule";
    document.getElementById("currentPeriod").textContent = "It's the weekend - no school today!";
    document.getElementById("timeRemaining").textContent = "";
    document.getElementById("nextPeriod").textContent = "";
    document.getElementById("lunchStatus").textContent = "";
    document.getElementById("periodBox").classList.remove("active");
    return;
  }

  const isMW = day === 1 || day === 3;
  const todaySchedule = isMW ? schedules.mw : schedules.ttf;

  document.getElementById("dayType").textContent = isMW
    ? "Monday/Wednesday Schedule"
    : "Tuesday/Thursday/Friday Schedule";

  let period = "No school right now";
  let timeLeft = "";
  let nextPeriodText = "";
  let active = false;

  for (let i = 0; i < todaySchedule.length; i += 1) {
    const [p, start, end] = todaySchedule[i];
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;

    if (currentTime >= startMins && currentTime < endMins) {
      period = `Current Period: ${p}`;
      const secsLeft = (endMins - currentTime) * 60 - now.getSeconds();
      const minsLeft = Math.floor(secsLeft / 60);
      const secLeft = secsLeft % 60;
      timeLeft = `${minsLeft}:${secLeft.toString().padStart(2, "0")} left in this period.`;
      active = true;

      if (i + 1 < todaySchedule.length) {
        const [np, ns] = todaySchedule[i + 1];
        nextPeriodText = `Next Period: ${np} starts at ${formatTime(...ns.split(":").map(Number))}`;
      }

      break;
    }

    if (currentTime < startMins) {
      period = "Passing Time";
      const minsUntil = startMins - currentTime;
      nextPeriodText = `Next Period: ${p} starts in ${minsUntil} min.`;
      break;
    }
  }

  let lunchMessage = "";
  let currentLunch = null;
  for (const lunch of lunches) {
    if (currentTime >= lunch.start && currentTime < lunch.end) {
      lunchMessage = `Currently Grade ${lunch.grade} Lunch Period`;
      currentLunch = lunch.grade;
      break;
    }
  }

  ["lunch5", "lunch6", "lunch7", "lunch8"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = el.textContent.replace(" (Current)", "");
    }
  });

  if (currentLunch) {
    const el = document.getElementById(`lunch${currentLunch}`);
    if (el && !el.textContent.includes(" (Current)")) {
      el.textContent += " (Current)";
    }
  }

  document.getElementById("currentPeriod").textContent = period;
  document.getElementById("timeRemaining").textContent = timeLeft;
  document.getElementById("nextPeriod").textContent = nextPeriodText;
  document.getElementById("lunchStatus").textContent = lunchMessage;
  document.getElementById("periodBox").classList.toggle("active", active);
}

function getWindDirection(deg) {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

function getWeatherDescription(code) {
  const weatherCodes = {
    0: "Clear",
    1: "Mostly Clear",
    2: "Partly Cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Rime Fog",
    51: "Light Drizzle",
    53: "Drizzle",
    55: "Heavy Drizzle",
    56: "Freezing Drizzle",
    57: "Heavy Freezing Drizzle",
    61: "Light Rain",
    63: "Rain",
    65: "Heavy Rain",
    66: "Freezing Rain",
    67: "Heavy Freezing Rain",
    71: "Light Snow",
    73: "Snow",
    75: "Heavy Snow",
    77: "Snow Grains",
    80: "Rain Showers",
    81: "Heavy Rain Showers",
    82: "Violent Rain Showers",
    85: "Snow Showers",
    86: "Heavy Snow Showers",
    95: "Thunderstorm",
    96: "Thunderstorm With Hail",
    99: "Severe Thunderstorm With Hail"
  };

  return weatherCodes[code] || "Current Conditions";
}

async function fetchWeather() {
  const weatherBox = document.getElementById("weatherBox");
  const weatherUrl = new URL("https://api.open-meteo.com/v1/forecast");

  weatherUrl.searchParams.set("latitude", "42.6687");
  weatherUrl.searchParams.set("longitude", "-71.5884");
  weatherUrl.searchParams.set("current", "temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m");
  weatherUrl.searchParams.set("temperature_unit", "fahrenheit");
  weatherUrl.searchParams.set("wind_speed_unit", "mph");
  weatherUrl.searchParams.set("timezone", "America/New_York");

  try {
    const res = await fetch(weatherUrl.toString());
    if (!res.ok) {
      throw new Error(`Weather request failed: ${res.status}`);
    }

    const data = await res.json();
    const current = data.current;
    const windDir = getWindDirection(current.wind_direction_10m);
    const conditions = getWeatherDescription(current.weather_code);

    weatherBox.innerHTML =
      `Temperature: <strong>${Math.round(current.temperature_2m)}F</strong> ` +
      `(feels like ${Math.round(current.apparent_temperature)}F)<br>` +
      `${conditions}<br>` +
      `Wind: ${windDir} at ${Math.round(current.wind_speed_10m)} mph`;
  } catch (error) {
    weatherBox.textContent = "Weather data unavailable.";
  }
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js");
  });
}

updateClock();
fetchWeather();
setInterval(updateClock, 1000);
setInterval(fetchWeather, 15 * 60 * 1000);
