const WMO_CODES = {
    0: { text: "Clear sky", icon: "01d" },
    1: { text: "Mainly clear", icon: "02d" },
    2: { text: "Partly cloudy", icon: "03d" },
    3: { text: "Overcast", icon: "04d" },
    45: { text: "Fog", icon: "50d" },
    48: { text: "Depositing rime fog", icon: "50d" },
    51: { text: "Light drizzle", icon: "09d" },
    53: { text: "Moderate drizzle", icon: "09d" },
    55: { text: "Dense drizzle", icon: "09d" },
    61: { text: "Slight rain", icon: "10d" },
    63: { text: "Moderate rain", icon: "10d" },
    65: { text: "Heavy rain", icon: "10d" },
    80: { text: "Slight rain showers", icon: "09d" },
    81: { text: "Moderate rain showers", icon: "09d" },
    82: { text: "Violent rain showers", icon: "09d" },
    95: { text: "Thunderstorm", icon: "11d" },
    96: { text: "Thunderstorm with hail", icon: "11d" },
    99: { text: "Thunderstorm with heavy hail", icon: "11d" },
};

const mapInput = document.getElementById("map-input");
const mapSearchBtn = document.getElementById("map-search-btn");
const myLocationBtn = document.getElementById("my-location-btn");
const mainMapIframe = document.getElementById("main-map-iframe");

function updateMap(location) {
    if (location) {
        const url = `https://maps.google.com/maps?q=${encodeURIComponent(location)}&hl=en&z=14&output=embed`;
        mainMapIframe.src = url;
    }
}

function getMyLocation() {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }
    
    myLocationBtn.textContent = "Locating...";
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            mainMapIframe.src = `https://maps.google.com/maps?q=${latitude},${longitude}&hl=en&z=14&output=embed`;
            myLocationBtn.textContent = "My Location";
        },
        (error) => {
            console.error("Error getting location:", error);
            alert("Unable to retrieve your location.");
            myLocationBtn.textContent = "My Location";
        }
    );
}

mapSearchBtn.addEventListener("click", () => {
    const location = mapInput.value.trim();
    if (location) updateMap(location);
});

myLocationBtn.addEventListener("click", getMyLocation);

mapInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        const location = mapInput.value.trim();
        if (location) updateMap(location);
    }
});

document.querySelectorAll(".nav a").forEach(link => {
    link.addEventListener("click", (e) => {
        e.preventDefault();

        document.querySelectorAll(".nav a").forEach(l => l.classList.remove("active"));
        link.classList.add("active");

        const sectionId = link.dataset.section;
        document.querySelectorAll("main > h1").forEach(h => h.style.display = "none");
        document.querySelectorAll(".section").forEach(section => section.style.display = "none");
        
        document.getElementById(sectionId).style.display = "block";
        document.querySelector(`.${sectionId.replace('-section', '')}-id`).style.display = "block";

        if (sectionId === "weather-section") {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        fetchWeatherByCoords(latitude, longitude);
                    },
                    () => {
                        fetchWeatherByCity("Manila");
                    }
                );
            } else {
                fetchWeatherByCity("Manila");
            }
        }
    });
});

function fetchWeatherByCity(city) {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    
    fetch(geoUrl)
        .then(response => response.json())
        .then(data => {
            if (!data.results || data.results.length === 0) {
                alert("City not found");
                return;
            }
            const { latitude, longitude, name, country } = data.results[0];
            fetchWeatherByCoords(latitude, longitude, `${name}, ${country}`);
        })
        .catch(error => {
            console.error("Geocoding error:", error);
            alert("Error finding city");
        });
}

function fetchWeatherByCoords(lat, lon, locationName = null) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,pressure_msl,uv_index&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_sum&timezone=auto&forecast_days=7`;
    
    if (!locationName) {
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
            .then(res => res.json())
            .then(geoData => {
                const city = geoData.address?.city || geoData.address?.town || geoData.address?.village || geoData.address?.municipality || geoData.address?.county || geoData.address?.state;
                const country = geoData.address?.country;
                locationName = city ? `${city}, ${country}` : `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
                return fetch(url).then(res => res.json()).then(data => {
                    data.location_name = locationName;
                    displayWeather(data);
                    displayHourlyForecast(data);
                    displayDailyForecast(data);
                });
            });
    } else {
        fetch(url)
            .then(response => response.json())
            .then(data => {
                data.location_name = locationName;
                displayWeather(data);
                displayHourlyForecast(data);
                displayDailyForecast(data);
            })
            .catch(error => {
                console.error("Error fetching weather:", error);
            });
    }
}

function displayWeather(data) {
    const current = data.current;
    const weatherInfo = WMO_CODES[current.weather_code] || { text: "Unknown", icon: "01d" };
    const uvIndex = current.uv_index || 0;
    const uvLevel = getUVLevel(uvIndex);

    document.getElementById("city-name").textContent = data.location_name;
    document.getElementById("temperature").textContent = Math.round(current.temperature_2m) + "°C";
    document.getElementById("description").textContent = weatherInfo.text;
    document.getElementById("humidity").textContent = current.relative_humidity_2m + "%";
    document.getElementById("wind").textContent = current.wind_speed_10m + " km/h";
    document.getElementById("pressure").textContent = Math.round(current.pressure_msl) + " hPa";
    document.getElementById("uv-index").textContent = uvIndex.toFixed(1);
    document.getElementById("uv-level").textContent = uvLevel;

    const iconUrl = `https://openweathermap.org/img/wn/${weatherInfo.icon}@2x.png`;
    document.getElementById("weather-icon").innerHTML = `<img src="${iconUrl}" alt="${weatherInfo.text}">`;
}

function getUVLevel(uv) {
    if (uv <= 2) return "Low";
    if (uv <= 5) return "Moderate";
    if (uv <= 7) return "High";
    if (uv <= 10) return "Very High";
    return "Extreme";
}

function displayHourlyForecast(data) {
    const forecastContainer = document.getElementById("forecast-container");
    forecastContainer.innerHTML = "";

    const hourly = data.hourly;
    const now = new Date();
    const currentEpoch = Math.floor(now.getTime() / 1000);

    for (let i = 0; i < hourly.time.length; i++) {
        const timeEpoch = Math.floor(new Date(hourly.time[i]).getTime() / 1000);
        
        if (timeEpoch > currentEpoch && timeEpoch <= currentEpoch + 24 * 3600) {
            const timeStr = new Date(hourly.time[i]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const temp = Math.round(hourly.temperature_2m[i]);
            const code = hourly.weather_code[i];
            const weatherInfo = WMO_CODES[code] || { text: "Unknown", icon: "01d" };
            const iconUrl = `https://openweathermap.org/img/wn/${weatherInfo.icon}.png`;

            const forecastItem = document.createElement("div");
            forecastItem.className = "forecast-item";
            forecastItem.innerHTML = `
                <div class="forecast-time">${timeStr}</div>
                <img src="${iconUrl}" alt="${weatherInfo.text}">
                <div class="forecast-temp">${temp}°C</div>
            `;
            forecastContainer.appendChild(forecastItem);
        }
    }
}

function displayDailyForecast(data) {
    const dailyContainer = document.getElementById("daily-forecast-container");
    dailyContainer.innerHTML = "";

    const daily = data.daily;
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (let i = 0; i < daily.time.length; i++) {
        const date = new Date(daily.time[i]);
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();
        const dayName = isToday ? "Today" : days[date.getDay()];
        const dateStr = `${date.getDate()} ${months[date.getMonth()]}`;
        const maxTemp = Math.round(daily.temperature_2m_max[i]);
        const minTemp = Math.round(daily.temperature_2m_min[i]);
        const code = daily.weather_code[i];
        const weatherInfo = WMO_CODES[code] || { text: "Unknown", icon: "01d" };
        const iconUrl = `https://openweathermap.org/img/wn/${weatherInfo.icon}.png`;
        const uvMax = daily.uv_index_max ? Math.round(daily.uv_index_max[i]) : 0;
        const uvLevel = getUVLevel(uvMax);
        const precipitation = daily.precipitation_sum ? daily.precipitation_sum[i].toFixed(1) : "0.0";

        const dailyItem = document.createElement("div");
        dailyItem.className = "daily-forecast-item";
        dailyItem.innerHTML = `
            <div class="daily-day">${dayName}</div>
            <div class="daily-date">${dateStr}</div>
            <img src="${iconUrl}" alt="${weatherInfo.text}">
            <div class="daily-temps">
                <span class="daily-max">${maxTemp}°</span>
                <span class="daily-min">${minTemp}°</span>
            </div>
            <div class="daily-desc">${weatherInfo.text}</div>
            <div class="daily-uv">UV ${uvMax} (${uvLevel})</div>
            <div class="daily-rain">Rain ${precipitation} mm</div>
        `;
        dailyContainer.appendChild(dailyItem);
    }
}

function init() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                mainMapIframe.src = `https://maps.google.com/maps?q=${latitude},${longitude}&hl=en&z=14&output=embed`;
                fetchWeatherByCoords(latitude, longitude);
            },
            () => {
                fetchWeatherByCity("Manila");
            }
        );
    } else {
        fetchWeatherByCity("Manila");
    }
}

init();
