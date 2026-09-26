// ===== CONFIGURATION =====
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0';

let API_KEY = localStorage.getItem('weatherApiKey') || '8545a704f6c58cdecf69ba24547b6093';

// ===== DOM ELEMENTS =====
const apiModal = document.getElementById('apiModal');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveApiKeyBtn = document.getElementById('saveApiKey');
const settingsBtn = document.getElementById('settingsBtn');

const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const suggestionsEl = document.getElementById('suggestions');

const loaderEl = document.getElementById('loader');
const errorMessageEl = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const retryBtn = document.getElementById('retryBtn');
const mainContent = document.getElementById('mainContent');
const welcomeScreen = document.getElementById('welcomeScreen');

const hourlyContainer = document.getElementById('hourlyContainer');
const dailyContainer = document.getElementById('dailyContainer');

const scrollLeftBtn = document.getElementById('scrollLeft');
const scrollRightBtn = document.getElementById('scrollRight');

let lastSearchedCity = '';

// ===== INIT =====
function init() {
    if (!API_KEY) {
        showApiModal();
    } else {
        hideApiModal();
        showWelcome();
    }
    setupEventListeners();
}

function showApiModal() {
    apiModal.classList.remove('hidden');
    apiKeyInput.value = API_KEY;
}

function hideApiModal() {
    apiModal.classList.add('hidden');
}

function showWelcome() {
    welcomeScreen.classList.remove('hidden');
    mainContent.classList.remove('active');
    loaderEl.classList.remove('active');
    errorMessageEl.classList.remove('active');
}

function hideWelcome() {
    welcomeScreen.classList.add('hidden');
}

function showLoader() {
    loaderEl.classList.add('active');
    mainContent.classList.remove('active');
    errorMessageEl.classList.remove('active');
    hideWelcome();
}

function hideLoader() {
    loaderEl.classList.remove('active');
}

function showError(msg) {
    errorText.textContent = msg;
    errorMessageEl.classList.add('active');
    mainContent.classList.remove('active');
    hideLoader();
    hideWelcome();
}

function showContent() {
    mainContent.classList.add('active');
    errorMessageEl.classList.remove('active');
    hideLoader();
    hideWelcome();
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // API Key
    saveApiKeyBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        if (key.length < 10) {
            alert('Please enter a valid API key');
            return;
        }
        API_KEY = key;
        localStorage.setItem('weatherApiKey', key);
        hideApiModal();
        showWelcome();
    });

    settingsBtn.addEventListener('click', showApiModal);

    // Search
    cityInput.addEventListener('input', () => {
        const query = cityInput.value.trim();
        if (query.length >= 2) {
            debouncedFetchSuggestions(query);
        } else {
            hideSuggestions();
        }
    });

    cityInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            hideSuggestions();
            const city = cityInput.value.trim();
            if (city) {
                lastSearchedCity = city;
                searchCity(city);
            }
        }
    });

    searchBtn.addEventListener('click', () => {
        hideSuggestions();
        const city = cityInput.value.trim();
        if (city) {
            lastSearchedCity = city;
            searchCity(city);
        }
    });

    // Location
    locationBtn.addEventListener('click', getUserLocation);

    // Retry
    retryBtn.addEventListener('click', () => {
        if (lastSearchedCity) {
            searchCity(lastSearchedCity);
        } else {
            getUserLocation();
        }
    });

    // Close suggestions on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            hideSuggestions();
        }
    });

    // Hourly scroll buttons
    scrollLeftBtn.addEventListener('click', () => {
        hourlyContainer.scrollBy({ left: -200, behavior: 'smooth' });
    });

    scrollRightBtn.addEventListener('click', () => {
        hourlyContainer.scrollBy({ left: 200, behavior: 'smooth' });
    });

    // Enter key on API modal
    apiKeyInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveApiKeyBtn.click();
    });
}

// ===== DEBOUNCE =====
function debounce(fn, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

const debouncedFetchSuggestions = debounce(fetchSuggestions, 350);

// ===== SUGGESTIONS =====
async function fetchSuggestions(query) {
    if (!API_KEY) return;

    try {
        const url = `${GEO_URL}/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`;
        const response = await fetch(url);

        if (!response.ok) {
            console.error('Geo API error:', response.status);
            if (response.status === 401) {
                showError('Invalid API key. Please check your key in settings.');
            }
            return;
        }

        const data = await response.json();

        if (!data || data.length === 0) {
            hideSuggestions();
            return;
        }

        renderSuggestions(data);
    } catch (err) {
        console.error('Suggestions fetch error:', err);
    }
}

function renderSuggestions(cities) {
    suggestionsEl.innerHTML = cities.map((city, index) => {
        const state = city.state ? `, ${city.state}` : '';
        return `
            <div class="suggestion-item" 
                 data-lat="${city.lat}" 
                 data-lon="${city.lon}" 
                 data-name="${city.name}, ${city.country}">
                <i class="fas fa-map-marker-alt"></i>
                <span class="city-name">${city.name}${state}</span>
                <span class="country-name">${city.country}</span>
            </div>
        `;
    }).join('');

    suggestionsEl.classList.add('active');

    // Attach click listeners
    suggestionsEl.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            const lat = parseFloat(item.dataset.lat);
            const lon = parseFloat(item.dataset.lon);
            const name = item.dataset.name;

            cityInput.value = name;
            lastSearchedCity = name;
            hideSuggestions();
            fetchAllWeatherData(lat, lon);
        });
    });
}

function hideSuggestions() {
    suggestionsEl.classList.remove('active');
    suggestionsEl.innerHTML = '';
}

// ===== GEOLOCATION =====
function getUserLocation() {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser.');
        return;
    }

    showLoader();
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            fetchAllWeatherData(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
            console.error('Geolocation error:', err);
            showError('Unable to get your location. Please allow location access or search manually.');
        },
        { timeout: 10000 }
    );
}

// ===== SEARCH CITY =====
async function searchCity(cityName) {
    if (!API_KEY) {
        showApiModal();
        return;
    }

    showLoader();

    try {
        const url = `${GEO_URL}/direct?q=${encodeURIComponent(cityName)}&limit=1&appid=${API_KEY}`;
        const response = await fetch(url);

        if (!response.ok) {
            if (response.status === 401) {
                showError('Invalid API key. Click the ⚙️ gear icon to update it.');
                return;
            }
            showError('Network error. Please try again.');
            return;
        }

        const data = await response.json();

        if (!data || data.length === 0) {
            showError(`City "${cityName}" not found. Try a different name or check spelling.`);
            return;
        }

        const { lat, lon } = data[0];
        await fetchAllWeatherData(lat, lon);
    } catch (err) {
        console.error('Search error:', err);
        showError('Connection failed. Please check your internet and try again.');
    }
}

// ===== FETCH ALL WEATHER DATA =====
async function fetchAllWeatherData(lat, lon) {
    if (!API_KEY) {
        showApiModal();
        return;
    }

    showLoader();

    try {
        // Fetch all data in parallel
        const [currentRes, forecastRes, aqiRes] = await Promise.all([
            fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`),
            fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`),
            fetch(`${BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`)
        ]);

        // Check responses
        if (!currentRes.ok) {
            if (currentRes.status === 401) {
                showError('Invalid API key. Click ⚙️ to update it. New keys take ~2 hours to activate.');
                return;
            }
            showError('Failed to fetch weather data. Please try again.');
            return;
        }

        const currentData = await currentRes.json();
        const forecastData = await forecastRes.json();
        const aqiData = aqiRes.ok ? await aqiRes.json() : null;

        // Update all sections
        updateCurrentWeather(currentData);
        updateHourlyForecast(forecastData, currentData.timezone);
        updateDailyForecast(forecastData);
        updateInfoCards(currentData);
        updateAQI(aqiData);
        updateMap(lat, lon);

        // Update input with found city name
        cityInput.value = `${currentData.name}, ${currentData.sys.country}`;

        showContent();
    } catch (err) {
        console.error('Fetch error:', err);
        showError('Something went wrong. Please check your connection and try again.');
    }
}

// ===== HELPER FUNCTIONS =====
function getIconUrl(iconCode) {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

function formatTime(timestamp, timezoneOffset) {
    const date = new Date((timestamp + timezoneOffset) * 1000);
    let hours = date.getUTCHours();
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
}

function formatFullDate(timestamp, timezoneOffset) {
    const date = new Date((timestamp + timezoneOffset) * 1000);
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' };
    const dateStr = date.toLocaleDateString('en-US', options);

    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;

    return `${dateStr} • ${h}:${minutes} ${ampm}`;
}

function formatHour(timestamp, timezoneOffset) {
    const date = new Date((timestamp + timezoneOffset) * 1000);
    let hours = date.getUTCHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours} ${ampm}`;
}

function getDayName(timestamp) {
    const date = new Date(timestamp * 1000);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function getShortDate(timestamp) {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getWindDir(deg) {
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return dirs[Math.round((deg % 360) / 22.5) % 16];
}

function getHumidityStatus(hum) {
    if (hum < 30) return 'Too Dry 🏜️';
    if (hum < 60) return 'Comfortable 👍';
    if (hum < 80) return 'Humid 💧';
    return 'Very Humid 🌊';
}

function getFeelsLikeDesc(feelsLike, actual) {
    const diff = feelsLike - actual;
    if (Math.abs(diff) < 2) return 'Similar to actual temperature';
    if (diff > 0) return 'Feels warmer due to humidity';
    return 'Feels cooler due to wind';
}

function getFeelsComparison(feelsLike, actual) {
    const diff = Math.round(feelsLike - actual);
    if (diff === 0) return 'Same as actual';
    if (diff > 0) return `${diff}° warmer than actual`;
    return `${Math.abs(diff)}° cooler than actual`;
}

// ===== UPDATE CURRENT WEATHER =====
function updateCurrentWeather(data) {
    document.getElementById('cityName').textContent = `${data.name}, ${data.sys.country}`;
    document.getElementById('dateTime').textContent = formatFullDate(data.dt, data.timezone);
    document.getElementById('currentIcon').src = getIconUrl(data.weather[0].icon);
    document.getElementById('currentTemp').textContent = `${Math.round(data.main.temp)}°C`;
    document.getElementById('weatherDesc').textContent = data.weather[0].description;
    document.getElementById('feelsLike').textContent = `${Math.round(data.main.feels_like)}°C`;
    document.getElementById('tempHigh').textContent = `${Math.round(data.main.temp_max)}°C`;
    document.getElementById('tempLow').textContent = `${Math.round(data.main.temp_min)}°C`;
    document.getElementById('windSpeed').textContent = `${(data.wind.speed * 3.6).toFixed(1)} km/h`;
    document.getElementById('humidity').textContent = `${data.main.humidity}%`;
    document.getElementById('visibility').textContent = data.visibility ? `${(data.visibility / 1000).toFixed(1)} km` : 'N/A';
    document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;
    document.getElementById('sunrise').textContent = formatTime(data.sys.sunrise, data.timezone);
    document.getElementById('sunset').textContent = formatTime(data.sys.sunset, data.timezone);
    document.getElementById('clouds').textContent = `${data.clouds.all}%`;
    document.getElementById('windDir').textContent = `${getWindDir(data.wind.deg || 0)} (${data.wind.deg || 0}°)`;

    document.title = `${data.name} ${Math.round(data.main.temp)}°C | WeatherPulse`;

    updateBackground(data.weather[0].main, data.weather[0].icon);
}

function updateBackground(weatherMain, icon) {
    const isNight = icon.includes('n');
    let gradient;

    const weatherType = weatherMain.toLowerCase();
    if (weatherType === 'clear') {
        gradient = isNight
            ? 'linear-gradient(135deg, #0f0f23, #1a1a3e, #0f0f23)'
            : 'linear-gradient(135deg, #1a1a3e, #2d3561, #1e2250)';
    } else if (weatherType === 'clouds') {
        gradient = 'linear-gradient(135deg, #1a1a2e, #2a2a4a, #1e1e38)';
    } else if (weatherType === 'rain' || weatherType === 'drizzle') {
        gradient = 'linear-gradient(135deg, #0f0f1e, #1a2332, #121825)';
    } else if (weatherType === 'thunderstorm') {
        gradient = 'linear-gradient(135deg, #0a0a15, #15152a, #0d0d1a)';
    } else if (weatherType === 'snow') {
        gradient = 'linear-gradient(135deg, #1e2235, #2a3050, #222840)';
    } else {
        gradient = 'linear-gradient(135deg, #0f0f23, #1a1a3e, #0f0f23)';
    }

    document.body.style.background = gradient;
}

// ===== UPDATE HOURLY FORECAST =====
function updateHourlyForecast(data, timezone) {
    if (!data.list) return;

    const items = data.list.slice(0, 10);
    hourlyContainer.innerHTML = items.map((item, i) => {
        const rain = item.pop ? Math.round(item.pop * 100) : 0;
        const isNow = i === 0;
        return `
            <div class="hourly-item ${isNow ? 'now' : ''}">
                <span class="hourly-time">${isNow ? 'Now' : formatHour(item.dt, timezone)}</span>
                <img class="hourly-icon" src="${getIconUrl(item.weather[0].icon)}" alt="${item.weather[0].description}">
                <span class="hourly-temp">${Math.round(item.main.temp)}°</span>
                ${rain > 0 ? `<span class="hourly-rain"><i class="fas fa-droplet"></i> ${rain}%</span>` : ''}
            </div>
        `;
    }).join('');
}

// ===== UPDATE DAILY FORECAST =====
function updateDailyForecast(data) {
    if (!data.list) return;

    // Group forecast by day
    const dailyMap = {};
    data.list.forEach(item => {
        const dateKey = new Date(item.dt * 1000).toDateString();
        if (!dailyMap[dateKey]) {
            dailyMap[dateKey] = {
                dt: item.dt,
                temps: [],
                icons: [],
                descs: [],
                pops: []
            };
        }
        dailyMap[dateKey].temps.push(item.main.temp);
        dailyMap[dateKey].icons.push(item.weather[0].icon);
        dailyMap[dateKey].descs.push(item.weather[0].description);
        dailyMap[dateKey].pops.push(item.pop || 0);
    });

    const days = Object.values(dailyMap);

    // Get min/max for temp bar
    let allMin = Infinity, allMax = -Infinity;
    days.forEach(d => {
        const min = Math.min(...d.temps);
        const max = Math.max(...d.temps);
        if (min < allMin) allMin = min;
        if (max > allMax) allMax = max;
    });
    const range = allMax - allMin || 1;

    dailyContainer.innerHTML = days.map(day => {
        const minTemp = Math.round(Math.min(...day.temps));
        const maxTemp = Math.round(Math.max(...day.temps));

        // Pick middle-of-day icon
        const midIndex = Math.floor(day.icons.length / 2);
        const icon = day.icons[midIndex];
        const desc = day.descs[midIndex];
        const rain = Math.round(Math.max(...day.pops) * 100);

        // Temp bar position
        const left = ((Math.min(...day.temps) - allMin) / range) * 100;
        const width = Math.max(((Math.max(...day.temps) - Math.min(...day.temps)) / range) * 100, 5);

        return `
            <div class="daily-item">
                <div class="daily-day-info">
                    <div class="daily-day">${getDayName(day.dt)}</div>
                    <div class="daily-date">${getShortDate(day.dt)}</div>
                </div>
                <img class="daily-icon" src="${getIconUrl(icon)}" alt="${desc}">
                <div class="daily-desc">${desc}</div>
                <div class="daily-temp-bar">
                    <span class="daily-temp-min">${minTemp}°</span>
                    <div class="temp-bar">
                        <div class="temp-bar-fill" style="left:${left}%;width:${width}%"></div>
                    </div>
                    <span class="daily-temp-max">${maxTemp}°</span>
                </div>
                <span class="daily-rain">${rain > 0 ? `<i class="fas fa-droplet"></i> ${rain}%` : ''}</span>
            </div>
        `;
    }).join('');
}

// ===== UPDATE INFO CARDS =====
function updateInfoCards(data) {
    // Humidity
    const hum = data.main.humidity;
    document.getElementById('humidityPercent').textContent = `${hum}%`;
    document.getElementById('humidityStatus').textContent = getHumidityStatus(hum);

    const circumference = 2 * Math.PI * 40; // ~251.2
    const offset = circumference - (hum / 100) * circumference;
    document.getElementById('humidityCircle').style.strokeDashoffset = offset;

    // Wind
    const windDeg = data.wind.deg || 0;
    document.getElementById('compassArrow').style.transform = `translate(-50%, -100%) rotate(${windDeg}deg)`;
    document.getElementById('windSpeedDisplay').textContent = `${(data.wind.speed * 3.6).toFixed(1)} km/h`;

    const gustEl = document.getElementById('windGust');
    if (data.wind.gust) {
        gustEl.textContent = `Gusts: ${(data.wind.gust * 3.6).toFixed(1)} km/h`;
    } else {
        gustEl.textContent = '';
    }

    // Sun
    const sunriseTs = data.sys.sunrise;
    const sunsetTs = data.sys.sunset;
    const now = data.dt;
    const dayLength = sunsetTs - sunriseTs;
    const elapsed = Math.max(0, Math.min(now - sunriseTs, dayLength));
    const progress = dayLength > 0 ? elapsed / dayLength : 0;

    document.getElementById('sunriseTime2').textContent = formatTime(sunriseTs, data.timezone);
    document.getElementById('sunsetTime2').textContent = formatTime(sunsetTs, data.timezone);

    // Animate sun arc
    const arcFill = document.getElementById('sunArc');
    const totalLength = 300;
    arcFill.style.strokeDashoffset = totalLength - (progress * totalLength);

    // Move sun dot along arc
    const sunDot = document.getElementById('sunDot');
    // Parametric position on quadratic bezier: P0(10,110) CP(100,-10) P1(190,110)
    const t = Math.max(0, Math.min(progress, 1));
    const x = (1 - t) * (1 - t) * 10 + 2 * (1 - t) * t * 100 + t * t * 190;
    const y = (1 - t) * (1 - t) * 110 + 2 * (1 - t) * t * (-10) + t * t * 110;
    sunDot.setAttribute('cx', x);
    sunDot.setAttribute('cy', y);

    // Feels Like
    const feelsTemp = Math.round(data.main.feels_like);
    const actualTemp = Math.round(data.main.temp);
    document.getElementById('feelsLikeCard').textContent = `${feelsTemp}°C`;
    document.getElementById('feelsLikeDesc').textContent = getFeelsLikeDesc(feelsTemp, actualTemp);
    document.getElementById('feelsComparison').textContent = getFeelsComparison(feelsTemp, actualTemp);
}

// ===== UPDATE AQI =====
function updateAQI(data) {
    const badge = document.getElementById('aqiBadge');
    const status = document.getElementById('aqiStatus');
    const message = document.getElementById('aqiMessage');
    const barFill = document.getElementById('aqiBarFill');
    const details = document.getElementById('aqiDetails');

    if (!data || !data.list || !data.list.length) {
        badge.textContent = '--';
        status.textContent = 'Data unavailable';
        message.textContent = '';
        details.innerHTML = '';
        barFill.style.left = '0%';
        return;
    }

    const aqi = data.list[0].main.aqi;
    const comp = data.list[0].components;

    const labels = ['', 'Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
    const messages = [
        '',
        'Air quality is excellent. Enjoy outdoor activities!',
        'Air quality is acceptable for most people.',
        'Sensitive groups may experience minor effects.',
        'Everyone may begin to feel health effects.',
        'Health alert: serious risk of health effects.'
    ];
    const colors = ['', '#4ecdc4', '#44bd32', '#ffe66d', '#ff9f43', '#ff6b6b'];

    badge.textContent = aqi;
    badge.style.background = `linear-gradient(135deg, ${colors[aqi]}, ${colors[Math.min(aqi + 1, 5)]})`;
    status.textContent = labels[aqi] || 'Unknown';
    message.textContent = messages[aqi] || '';

    // Bar position (1-5 scale)
    const percent = ((aqi - 1) / 4) * 100;
    barFill.style.left = `calc(${percent}% - 7px)`;

    const pollutants = [
        { label: 'PM2.5', value: comp.pm2_5 },
        { label: 'PM10', value: comp.pm10 },
        { label: 'O₃', value: comp.o3 },
        { label: 'NO₂', value: comp.no2 },
        { label: 'SO₂', value: comp.so2 },
        { label: 'CO', value: comp.co }
    ];

    details.innerHTML = pollutants.map(p => `
        <div class="aqi-detail-item">
            <div class="label">${p.label}</div>
            <div class="value">${p.value != null ? p.value.toFixed(1) : '--'}</div>
        </div>
    `).join('');
}

// ===== UPDATE MAP =====
function updateMap(lat, lon) {
    const map = document.getElementById('weatherMap');
    const bbox = `${lon - 0.08},${lat - 0.06},${lon + 0.08},${lat + 0.06}`;
    map.src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
}

// ===== START =====
init();