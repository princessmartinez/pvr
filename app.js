const fullscreen = document.getElementById("fullscreen");
const fullscreenImg = document.getElementById("fullscreen-img");
const closeBtn = document.querySelector(".fullscreen-close");

document.querySelectorAll(".item img").forEach(img => {
    img.addEventListener("click", () => {
        fullscreenImg.src = img.src;
        fullscreen.classList.add("active");
    });
});

closeBtn.addEventListener("click", () => {
    fullscreen.classList.remove("active");
    fullscreenImg.src = "";
});

fullscreen.addEventListener("click", (e) => {
    if (e.target === fullscreen) {
        fullscreen.classList.remove("active");
        fullscreenImg.src = "";
    }
});

let map;
let marker;
let mapLoaded = false;

function initMap() {
    const defaultLocation = [17, 121];

    map = L.map("map").setView(defaultLocation, 10);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    marker = L.marker(defaultLocation, { draggable: true }).addTo(map);

    marker.on("dragend", function(event) {
        const latLng = event.target.getLatLng();
        updateWeatherByCoords(latLng.lat, latLng.lng);
    });

    map.on("click", function(event) {
        marker.setLatLng(event.latlng);
        updateWeatherByCoords(event.latlng.lat, event.latlng.lng);
    });

    mapLoaded = true;
    updateWeatherByCoords(17, 121);
}

function updateWeatherByCoords(lat, lon) {
    fetchWeatherByCoords(lat, lon);
}

function fetchWeatherByCoords(lat, lon) {
    const apiKey = "cafae7b2d6cf48038d1151225262503";
    const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lon}`;
    fetchWeather(url);
}

function fetchWeatherByCity(city) {
    const apiKey = "cafae7b2d6cf48038d1151225262503";
    const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}`;
    fetchWeather(url);
}

function fetchWeather(url) {
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error.message);
            } else {
                displayWeather(data);
            }
        })
        .catch(error => {
            console.error("Error fetching weather:", error);
            alert("Error fetching weather data");
        });
}

function displayWeather(data) {
    document.getElementById("city-name").textContent = data.location.name + ", " + data.location.country;
    document.getElementById("temperature").textContent = Math.round(data.current.temp_c) + "°C";
    document.getElementById("description").textContent = data.current.condition.text;
    document.getElementById("humidity").textContent = data.current.humidity + "%";
    document.getElementById("wind").textContent = data.current.wind_kph + " km/h";
    document.getElementById("pressure").textContent = data.current.pressure_mb + " hPa";

    const iconUrl = "https:" + data.current.condition.icon;
    document.getElementById("weather-icon").innerHTML =
        `<img src="${iconUrl}" alt="Weather icon">`;

    if (map && marker) {
        const newPos = [data.location.lat, data.location.lon];
        map.setView(newPos);
        marker.setLatLng(newPos);
    }
}

document.getElementById("search-btn").addEventListener("click", () => {
    const city = document.getElementById("city-input").value.trim();
    if (city) {
        fetchWeatherByCity(city);
    }
});

document.getElementById("city-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        const city = document.getElementById("city-input").value.trim();
        if (city) {
            fetchWeatherByCity(city);
        }
    }
});

document.querySelectorAll(".nav a").forEach(link => {
    link.addEventListener("click", (e) => {
        e.preventDefault();

        document.querySelectorAll(".nav a").forEach(l => l.classList.remove("active"));
        link.classList.add("active");

        const sectionId = link.dataset.section;
        document.querySelectorAll("main > section").forEach(section => {
            section.style.display = "none";
        });
        document.getElementById(sectionId).style.display = "block";

        if (sectionId === "map-section" && map) {
            setTimeout(() => {
                map.invalidateSize();
            }, 100);
        }
    });
});

initMap();
