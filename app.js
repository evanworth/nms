const schedule = [
  ["1", "08:05", "08:57"],
  ["2", "08:57", "09:44"],
  ["3", "09:44", "10:31"],
  ["4", "10:31", "11:18"],
  ["5", "11:18", "12:05"],
  ["6", "12:05", "12:52"],
  ["7", "12:52", "13:39"],
  ["8", "13:39", "14:25"]
];

const lunches = [
  { grade: 5, start: 650, end: 680 },
  { grade: 8, start: 682, end: 712 },
  { grade: 7, start: 714, end: 744 },
  { grade: 6, start: 746, end: 776 }
];

const lastSchoolDay = {
  month: 5,
  day: 16
};

function formatTime(hours, minutes) {
  const ampm = hours >= 12 ? "PM" : "AM";
  const hr = hours % 12 || 12;
  return `${hr}:${minutes.toString().padStart(2, "0")} ${ampm}`;
}

function isWeekday(date) {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

function countSchoolDaysLeft(today) {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(today.getFullYear(), lastSchoolDay.month, lastSchoolDay.day);

  if (start > end) {
    return 0;
  }

  let daysLeft = 0;
  const cursor = new Date(start);

  while (cursor <= end) {
    if (isWeekday(cursor)) {
      daysLeft += 1;
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return daysLeft;
}

function updateSchoolCountdown(now) {
  const daysLeft = countSchoolDaysLeft(now);
  const countdownEl = document.getElementById("schoolCountdown");

  if (daysLeft === 0) {
    countdownEl.textContent = "School year complete";
    return;
  }

  countdownEl.textContent = `${daysLeft} school ${daysLeft === 1 ? "day" : "days"} left`;
}

function updateClock() {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const day = now.getDay();
  const periodBox = document.getElementById("periodBox");
  const timeRemainingEl = document.getElementById("timeRemaining");

  document.getElementById("clock").textContent = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  document.getElementById("todayDate").textContent = `Today's Date: ${now.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  })}`;

  updateSchoolCountdown(now);

  if (day === 0 || day === 6) {
    document.getElementById("dayType").textContent = "Weekend Schedule";
    document.getElementById("currentPeriod").textContent = "It's the weekend - no school today!";
    document.getElementById("timeRemaining").textContent = "";
    document.getElementById("nextPeriod").textContent = "";
    document.getElementById("lunchStatus").textContent = "";
    periodBox.classList.remove("active", "ending-soon");
    timeRemainingEl.classList.remove("ending-soon");
    return;
  }

  const todaySchedule = schedule;

  document.getElementById("dayType").textContent = "Daily Schedule";

  let period = "No school right now";
  let timeLeft = "";
  let nextPeriodText = "";
  let active = false;
  let endingSoon = false;

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
      endingSoon = secsLeft <= 5 * 60;

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
  timeRemainingEl.textContent = timeLeft;
  document.getElementById("nextPeriod").textContent = nextPeriodText;
  document.getElementById("lunchStatus").textContent = lunchMessage;
  periodBox.classList.toggle("active", active);
  periodBox.classList.toggle("ending-soon", active && endingSoon);
  timeRemainingEl.classList.toggle("ending-soon", active && endingSoon);
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
