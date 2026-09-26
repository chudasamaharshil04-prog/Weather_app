# Weather_app
A modern, fully responsive weather dashboard built with vanilla HTML, CSS, and JavaScript. Features real-time city search with autocomplete, hourly &amp; 5-day extended forecasts, interactive air quality index, live sun/wind tracking, and embedded maps powered by OpenWeatherMap
# 🌦️ WeatherPulse — Interactive Weather Dashboard

A sleek, modern, and fully responsive weather dashboard built using **pure HTML5, CSS3, and Vanilla JavaScript** (no external frameworks or libraries required). Powered by the **OpenWeatherMap API** and **OpenStreetMap**.

---

## ✨ Features

- 🔍 **Live City Search & Autocomplete:** Real-time search suggestions as you type using the OpenWeatherMap Geocoding API.
- 📍 **Geolocation Support:** Automatically fetches local weather with a single click.
- 🌡️ **Detailed Current Conditions:** Temperature, "feels like", humidity, wind speed & direction, pressure, visibility, and cloud cover.
- ⏱️ **24-Hour Forecast:** Horizontal scrollable hourly temperature and precipitation chances.
- 📅 **5-Day / Extended Forecast:** Daily high/low temperature distribution bars and weather condition indicators.
- 🧭 **Interactive Widgets:**
  - **Wind Compass:** Dynamic rotating directional indicator.
  - **Humidity Gauge:** Circular animated SVG progress indicator.
  - **Sun Cycle Arc:** Real-time solar position curve calculation based on local sunrise/sunset times.
  - **Air Quality Index (AQI):** Breakdown of pollutants (PM2.5, PM10, O₃, NO₂, SO₂, CO) with visual status levels.
- 🗺️ **Embedded Live Map:** Interactive OpenStreetMap centered dynamically on searched coordinates.
- 🎨 **Dynamic Glassmorphism UI:** Background gradients and atmosphere shift automatically based on weather conditions (Clear, Clouds, Rain, Thunderstorm, Snow) and day/night cycles.
- 📱 **100% Mobile Responsive:** Optimized across desktop, tablet, and mobile screens.
- 🔑 **Built-in API Key Management:** In-app setup modal storing keys securely in browser `localStorage`.

---

## 🛠️ Tech Stack

- **HTML5:** Semantic markup structure.
- **CSS3:** Custom properties (CSS variables), Flexbox, CSS Grid, SVG styling, animations, and glassmorphic styling.
- **JavaScript (ES6+):** Fetch API, Async/Await, Debouncing, Geolocation API, DOM manipulation.
- **APIs:**
  - [OpenWeatherMap Current Weather Data](https://openweathermap.org/current)
  - [OpenWeatherMap 5-Day / 3-Hour Forecast](https://openweathermap.org/forecast5)
  - [OpenWeatherMap Air Pollution API](https://openweathermap.org/api/air-pollution)
  - [OpenWeatherMap Geocoding API](https://openweathermap.org/api/geocoding-api)
  - [OpenStreetMap](https://www.openstreetmap.org/)

---

## 🚀 Getting Started

### Prerequisites

You need a free API key from OpenWeatherMap:
1. Sign up at [OpenWeatherMap](https://home.openweathermap.org/users/sign_up).
2. Go to your [API Keys page](https://home.openweathermap.org/api_keys) and copy your key.
*(Note: New keys can take up to 1–2 hours to activate).*

### Installation & Run

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/weather-dashboard.git
