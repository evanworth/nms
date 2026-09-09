const APP_VERSION = "4.1";
const STORAGE_KEY = "nextblock-school-profile-v1";

const defaultConfig = {
  schoolName: "Nissitissit Middle School",
  footer: "Patriot Pride Starts With You",
  logo: "nms-logo.png",
  primaryColor: "#003366",
  accentColor: "#be1e2d",
  locationName: "Pepperell, Massachusetts",
  latitude: 42.6687,
  longitude: -71.5884,
  timezone: "America/New_York",
  lastSchoolDay: "2027-06-11",
  noSchoolDates: [
    "2026-09-04", "2026-09-07", "2026-10-12", "2026-11-03", "2026-11-11",
    "2026-11-25", "2026-11-26", "2026-11-27", "2026-12-23", "2026-12-24",
    "2026-12-25", "2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31",
    "2027-01-01", "2027-01-18", "2027-02-15", "2027-02-16", "2027-02-17",
    "2027-02-18", "2027-02-19", "2027-04-19", "2027-04-20", "2027-04-21",
    "2027-04-22", "2027-04-23", "2027-05-31"
  ],
  schedule: [
    { label: "1", start: "08:05", end: "08:57" },
    { label: "2", start: "08:57", end: "09:44" },
    { label: "3", start: "09:44", end: "10:31" },
    { label: "4", start: "10:31", end: "11:18" },
    { label: "5", start: "11:18", end: "12:05" },
    { label: "6", start: "12:05", end: "12:52" },
    { label: "7", start: "12:52", end: "13:39" },
    { label: "8", start: "13:39", end: "14:25" }
  ],
  lunches: [
    { label: "Grade 5", start: "10:50", end: "11:20" },
    { label: "Grade 8", start: "11:22", end: "11:52" },
    { label: "Grade 7", start: "11:54", end: "12:24" },
    { label: "Grade 6", start: "12:26", end: "12:56" }
  ]
};

let config = loadConfig();

function cloneDefaults() {
  return JSON.parse(JSON.stringify(defaultConfig));
}

function normalizeConfig(value) {
  const fallback = cloneDefaults();
  if (!value || typeof value !== "object") return fallback;
  const normalized = {
    ...fallback,
    ...value,
    schedule: Array.isArray(value.schedule) && value.schedule.length ? value.schedule : fallback.schedule,
    lunches: Array.isArray(value.lunches) ? value.lunches : fallback.lunches,
    noSchoolDates: Array.isArray(value.noSchoolDates) ? value.noSchoolDates : fallback.noSchoolDates
  };
  // Migrate the previous built-in calendar while preserving user-entered dates.
  if (value.lastSchoolDay === "2027-06-16" && !Array.isArray(value.noSchoolDates)) {
    normalized.lastSchoolDay = fallback.lastSchoolDay;
  }
  return normalized;
}

function loadConfig() {
  try {
    return normalizeConfig(JSON.parse(localStorage.getItem(STORAGE_KEY)));
  } catch (_error) {
    return cloneDefaults();
  }
}

function saveConfig(nextConfig) {
  config = normalizeConfig(nextConfig);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  applyConfig();
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatTime(time) {
  const [hours, minutes] = time.split(":").map(Number);
  const ampm = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${ampm}`;
}

function isWeekday(date) {
  return date.getDay() !== 0 && date.getDay() !== 6;
}

function countSchoolDaysLeft(today) {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const [year, month, day] = config.lastSchoolDay.split("-").map(Number);
  const end = new Date(year, month - 1, day);
  if (start > end) return 0;

  let daysLeft = 0;
  const noSchoolDates = new Set(config.noSchoolDates || []);
  const cursor = new Date(start);
  while (cursor <= end) {
    const dateKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    if (isWeekday(cursor) && !noSchoolDates.has(dateKey)) daysLeft += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return daysLeft;
}

function updateSchoolCountdown(now) {
  const daysLeft = countSchoolDaysLeft(now);
  document.getElementById("schoolCountdown").textContent = daysLeft
    ? `${daysLeft} school ${daysLeft === 1 ? "day" : "days"} left`
    : "School year complete";
}

function applyConfig() {
  document.documentElement.style.setProperty("--primary", config.primaryColor);
  document.documentElement.style.setProperty("--accent", config.accentColor);
  document.querySelector('meta[name="theme-color"]').content = config.primaryColor;
  document.getElementById("schoolName").textContent = config.schoolName;
  document.getElementById("footerText").textContent = config.footer || config.schoolName;
  document.getElementById("schoolLogo").src = config.logo || defaultConfig.logo;
  document.getElementById("schoolLogo").alt = `${config.schoolName} logo`;
  document.getElementById("appVersion").textContent = `v${APP_VERSION}`;
  document.getElementById("lunchList").innerHTML = config.lunches
    .map((lunch, index) => `<p data-lunch-index="${index}"><strong>${escapeHtml(lunch.label)}:</strong> ${formatTime(lunch.start)}–${formatTime(lunch.end)}</p>`)
    .join("");
  document.getElementById("scheduleList").innerHTML = config.schedule
    .map((period) => `<p><strong>${escapeHtml(period.label)}</strong><span>${formatTime(period.start)}–${formatTime(period.end)}</span></p>`)
    .join("");
  updateClock();
  fetchWeather();
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = String(value);
  return div.innerHTML;
}

function updateClock() {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const periodBox = document.getElementById("periodBox");
  const timeRemainingEl = document.getElementById("timeRemaining");

  document.getElementById("clock").textContent = now.toLocaleTimeString([], {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true
  });
  document.getElementById("todayDate").textContent = now.toLocaleDateString([], {
    weekday: "long", month: "long", day: "numeric", year: "numeric"
  });
  updateSchoolCountdown(now);

  if (!isWeekday(now)) {
    setPeriodDisplay("Weekend Schedule", "No school today", "", "", "", false, false);
    return;
  }

  let period = "School is not in session";
  let timeLeft = "";
  let nextPeriodText = "";
  let active = false;
  let endingSoon = false;

  for (let i = 0; i < config.schedule.length; i += 1) {
    const item = config.schedule[i];
    const startMins = timeToMinutes(item.start);
    const endMins = timeToMinutes(item.end);
    if (currentTime >= startMins && currentTime < endMins) {
      const secsLeft = (endMins - currentTime) * 60 - now.getSeconds();
      period = `Current Period: ${item.label}`;
      timeLeft = `${Math.floor(secsLeft / 60)}:${String(secsLeft % 60).padStart(2, "0")} left`;
      active = true;
      endingSoon = secsLeft <= 300;
      if (config.schedule[i + 1]) {
        nextPeriodText = `Next: ${config.schedule[i + 1].label} at ${formatTime(config.schedule[i + 1].start)}`;
      }
      break;
    }
    if (currentTime < startMins) {
      period = i === 0 ? "School has not started" : "Passing Time";
      nextPeriodText = `Next: ${item.label} at ${formatTime(item.start)}`;
      break;
    }
  }

  let lunchMessage = "";
  let currentLunch = -1;
  config.lunches.forEach((lunch, index) => {
    if (currentTime >= timeToMinutes(lunch.start) && currentTime < timeToMinutes(lunch.end)) {
      lunchMessage = `Currently ${lunch.label} Lunch`;
      currentLunch = index;
    }
  });
  document.querySelectorAll("[data-lunch-index]").forEach((el) => {
    el.classList.toggle("current-lunch", Number(el.dataset.lunchIndex) === currentLunch);
  });
  setPeriodDisplay("Daily Schedule", period, timeLeft, nextPeriodText, lunchMessage, active, endingSoon);

  function setPeriodDisplay(dayType, current, remaining, next, lunch, isActive, isEndingSoon) {
    document.getElementById("dayType").textContent = dayType;
    document.getElementById("currentPeriod").textContent = current;
    timeRemainingEl.textContent = remaining;
    document.getElementById("nextPeriod").textContent = next;
    document.getElementById("lunchStatus").textContent = lunch;
    periodBox.classList.toggle("active", isActive);
    periodBox.classList.toggle("ending-soon", isActive && isEndingSoon);
    timeRemainingEl.classList.toggle("ending-soon", isActive && isEndingSoon);
  }
}

function getWindDirection(deg) {
  return ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(deg / 45) % 8];
}

function getWeatherDescription(code) {
  const codes = { 0: "Clear", 1: "Mostly Clear", 2: "Partly Cloudy", 3: "Overcast", 45: "Fog", 48: "Rime Fog", 51: "Light Drizzle", 53: "Drizzle", 55: "Heavy Drizzle", 61: "Light Rain", 63: "Rain", 65: "Heavy Rain", 71: "Light Snow", 73: "Snow", 75: "Heavy Snow", 80: "Rain Showers", 81: "Heavy Rain Showers", 82: "Violent Rain Showers", 85: "Snow Showers", 86: "Heavy Snow Showers", 95: "Thunderstorm", 96: "Thunderstorm With Hail", 99: "Severe Thunderstorm With Hail" };
  return codes[code] || "Current Conditions";
}

async function fetchWeather() {
  const weatherBox = document.getElementById("weatherBox");
  weatherBox.textContent = `Loading ${config.locationName} weather...`;
  try {
    const weatherUrl = new URL("/api/weather", window.location.origin);
    weatherUrl.searchParams.set("latitude", config.latitude);
    weatherUrl.searchParams.set("longitude", config.longitude);
    weatherUrl.searchParams.set("timezone", config.timezone || "auto");
    const response = await fetch(weatherUrl, { cache: "no-store" });
    if (!response.ok) throw new Error("Weather request failed");
    const current = await response.json();
    weatherBox.innerHTML = `<h2>${escapeHtml(config.locationName)} Weather</h2><p class="temperature">${Math.round(current.temperature)}°F</p><p>Feels like ${Math.round(current.apparentTemperature)}°F · ${getWeatherDescription(current.weatherCode)}</p><p>Wind ${getWindDirection(current.windDirection)} at ${Math.round(current.windSpeed)} mph</p>`;
  } catch (_error) {
    weatherBox.innerHTML = `<h2>Weather</h2><p>Weather data is temporarily unavailable.</p><button class="secondary-button" id="retryWeather" type="button">Try again</button>`;
    document.getElementById("retryWeather").addEventListener("click", fetchWeather, { once: true });
  }
}

function editorRow(item, type) {
  const row = document.createElement("div");
  row.className = "editor-row";
  row.dataset.type = type;
  row.innerHTML = `<input class="row-label" value="${escapeHtml(item.label)}" aria-label="Label" required><input class="row-start" type="time" value="${item.start}" aria-label="Start time" required><input class="row-end" type="time" value="${item.end}" aria-label="End time" required><button class="remove-row" type="button" aria-label="Remove row">×</button>`;
  row.querySelector(".remove-row").addEventListener("click", () => row.remove());
  return row;
}

function renderEditor(containerId, items, type) {
  const container = document.getElementById(containerId);
  container.replaceChildren(...items.map((item) => editorRow(item, type)));
}

function openSettings() {
  document.getElementById("settingSchoolName").value = config.schoolName;
  document.getElementById("settingFooter").value = config.footer;
  document.getElementById("settingPrimary").value = config.primaryColor;
  document.getElementById("settingAccent").value = config.accentColor;
  document.getElementById("settingLocation").value = config.locationName;
  document.getElementById("settingLatitude").value = config.latitude;
  document.getElementById("settingLongitude").value = config.longitude;
  document.getElementById("settingTimezone").value = config.timezone;
  document.getElementById("settingLastDay").value = config.lastSchoolDay;
  document.getElementById("locationStatus").textContent = `Using ${config.latitude}, ${config.longitude}`;
  document.getElementById("settingsError").textContent = "";
  renderEditor("periodEditor", config.schedule, "period");
  renderEditor("lunchEditor", config.lunches, "lunch");
  document.getElementById("settingsDialog").showModal();
}

async function findLocation() {
  const query = document.getElementById("settingLocation").value.trim();
  const status = document.getElementById("locationStatus");
  if (!query) return;
  status.textContent = "Searching...";
  try {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.searchParams.set("name", query);
    url.searchParams.set("count", "1");
    url.searchParams.set("language", "en");
    const response = await fetch(url);
    const result = (await response.json()).results?.[0];
    if (!result) throw new Error("No location found");
    const displayName = [result.name, result.admin1, result.country_code].filter(Boolean).join(", ");
    document.getElementById("settingLocation").value = displayName;
    document.getElementById("settingLatitude").value = result.latitude;
    document.getElementById("settingLongitude").value = result.longitude;
    document.getElementById("settingTimezone").value = result.timezone || "auto";
    status.textContent = `Found ${displayName}`;
  } catch (_error) {
    status.textContent = "Location not found. Try a nearby city and state.";
  }
}

function collectRows(containerId) {
  return [...document.querySelectorAll(`#${containerId} .editor-row`)].map((row) => ({
    label: row.querySelector(".row-label").value.trim(),
    start: row.querySelector(".row-start").value,
    end: row.querySelector(".row-end").value
  }));
}

function validateRows(rows, name) {
  if (!rows.length && name === "period") throw new Error("Add at least one class period.");
  rows.forEach((row) => {
    if (!row.label || !row.start || !row.end) throw new Error(`Complete every ${name} row.`);
    if (timeToMinutes(row.start) >= timeToMinutes(row.end)) throw new Error(`${row.label} must end after it starts.`);
  });
}

function readLogo(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(config.logo);
    if (file.size > 2 * 1024 * 1024) return reject(new Error("Logo must be smaller than 2 MB."));
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("The logo could not be read."));
    reader.readAsDataURL(file);
  });
}

document.getElementById("settingsForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const error = document.getElementById("settingsError");
  error.textContent = "";
  try {
    const schedule = collectRows("periodEditor");
    const lunches = collectRows("lunchEditor");
    validateRows(schedule, "period");
    validateRows(lunches, "lunch");
    const latitude = Number(document.getElementById("settingLatitude").value);
    const longitude = Number(document.getElementById("settingLongitude").value);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) throw new Error("Find and confirm the weather location.");
    saveConfig({
      schoolName: document.getElementById("settingSchoolName").value.trim(),
      footer: document.getElementById("settingFooter").value.trim(),
      logo: await readLogo(document.getElementById("settingLogo").files[0]),
      primaryColor: document.getElementById("settingPrimary").value,
      accentColor: document.getElementById("settingAccent").value,
      locationName: document.getElementById("settingLocation").value.trim(),
      latitude, longitude,
      timezone: document.getElementById("settingTimezone").value || "auto",
      lastSchoolDay: document.getElementById("settingLastDay").value,
      schedule, lunches
    });
    document.getElementById("settingsDialog").close();
  } catch (err) {
    error.textContent = err.message;
  }
});

document.getElementById("openSettings").addEventListener("click", openSettings);
["closeSettings", "cancelSettings"].forEach((id) => document.getElementById(id).addEventListener("click", () => document.getElementById("settingsDialog").close()));
document.getElementById("findLocation").addEventListener("click", findLocation);
document.getElementById("addPeriod").addEventListener("click", () => document.getElementById("periodEditor").append(editorRow({ label: "New", start: "08:00", end: "09:00" }, "period")));
document.getElementById("addLunch").addEventListener("click", () => document.getElementById("lunchEditor").append(editorRow({ label: "Lunch", start: "11:00", end: "11:30" }, "lunch")));
document.getElementById("resetSettings").addEventListener("click", () => {
  if (confirm("Reset all school settings to the Nissitissit defaults?")) {
    localStorage.removeItem(STORAGE_KEY);
    config = cloneDefaults();
    applyConfig();
    openSettings();
  }
});
document.getElementById("exportSettings").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${config.schoolName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-nextblock.json`;
  link.click();
  URL.revokeObjectURL(link.href);
});
document.getElementById("importSettings").addEventListener("change", async (event) => {
  try {
    const imported = normalizeConfig(JSON.parse(await event.target.files[0].text()));
    saveConfig(imported);
    openSettings();
  } catch (_error) {
    document.getElementById("settingsError").textContent = "That profile file is not valid.";
  }
});

if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js"));
applyConfig();
setInterval(updateClock, 1000);
setInterval(fetchWeather, 15 * 60 * 1000);
