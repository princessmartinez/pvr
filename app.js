const fullscreen = document.getElementById("fullscreen");
const fullscreenImg = document.getElementById("fullscreen-img");
const closeBtn = document.querySelector(".fullscreen-close");

function toggleMenu() {
    document.querySelector(".navbar").classList.toggle("active");
}

document.querySelectorAll(".nav-item a").forEach(link => {
    link.addEventListener("click", () => {
        if (window.innerWidth <= 768) {
            document.querySelector(".navbar").classList.remove("active");
        }
    });
});

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
    56: { text: "Light freezing drizzle", icon: "09d" },
    57: { text: "Dense freezing drizzle", icon: "09d" },
    61: { text: "Slight rain", icon: "10d" },
    63: { text: "Moderate rain", icon: "10d" },
    65: { text: "Heavy rain", icon: "10d" },
    66: { text: "Light freezing rain", icon: "10d" },
    67: { text: "Heavy freezing rain", icon: "10d" },
    71: { text: "Slight snow fall", icon: "13d" },
    73: { text: "Moderate snow fall", icon: "13d" },
    75: { text: "Heavy snow fall", icon: "13d" },
    77: { text: "Snow grains", icon: "13d" },
    80: { text: "Slight rain showers", icon: "09d" },
    81: { text: "Moderate rain showers", icon: "09d" },
    82: { text: "Violent rain showers", icon: "09d" },
    85: { text: "Slight snow showers", icon: "13d" },
    86: { text: "Heavy snow showers", icon: "13d" },
    95: { text: "Thunderstorm", icon: "11d" },
    96: { text: "Thunderstorm with slight hail", icon: "11d" },
    99: { text: "Thunderstorm with heavy hail", icon: "11d" },
};

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
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,pressure_msl&hourly=temperature_2m,weather_code&timezone=auto&forecast_days=2`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (locationName) {
                data.location_name = locationName;
            } else {
                // Check if these are the user's specific coordinates for Barsat East Baggao Cagayan
                const isUserLoc = (Math.abs(lat - 17.94) < 0.1 && Math.abs(lon - 121.88) < 0.1);
                data.location_name = isUserLoc ? "Barsat East Baggao Cagayan" : "Current Location";
            }
            displayWeather(data);
            displayHourlyForecast(data);
        })
        .catch(error => {
            console.error("Error fetching weather:", error);
            alert("Error fetching weather data");
        });
}

function displayWeather(data) {
    const current = data.current;
    const weatherInfo = WMO_CODES[current.weather_code] || { text: "Unknown", icon: "01d" };

    document.getElementById("city-name").textContent = data.location_name;
    document.getElementById("temperature").textContent = Math.round(current.temperature_2m) + "°C";
    document.getElementById("description").textContent = weatherInfo.text;
    document.getElementById("humidity").textContent = current.relative_humidity_2m + "%";
    document.getElementById("wind").textContent = current.wind_speed_10m + " km/h";
    document.getElementById("pressure").textContent = Math.round(current.pressure_msl) + " hPa";

    // Use OpenWeatherMap icons as a free fallback for the WMO codes
    const iconUrl = `https://openweathermap.org/img/wn/${weatherInfo.icon}@2x.png`;
    document.getElementById("weather-icon").innerHTML =
        `<img src="${iconUrl}" alt="${weatherInfo.text}">`;
}

function displayHourlyForecast(data) {
    const forecastContainer = document.getElementById("forecast-container");
    forecastContainer.innerHTML = "";

    const hourly = data.hourly;
    const now = new Date();
    const currentEpoch = Math.floor(now.getTime() / 1000);

    // Open-Meteo provides hourly arrays for time, temp, and weather_code
    for (let i = 0; i < hourly.time.length; i++) {
        const timeEpoch = Math.floor(new Date(hourly.time[i]).getTime() / 1000);
        
        // Only show next 24 hours starting from now
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

const mapInput = document.getElementById("map-input");
const mapSearchBtn = document.getElementById("map-search-btn");
const myLocationBtn = document.getElementById("my-location-btn");
const mainMapIframe = document.getElementById("main-map-iframe");

function updateMap(location, showMarker = false) {
    if (location) {
        let url;
        if (showMarker) {
            url = `https://maps.google.com/maps?q=${location}&hl=en&z=17&output=embed`;
        } else {
            url = `https://maps.google.com/maps?q=${encodeURIComponent(location)}&hl=en&z=15&output=embed`;
        }
        mainMapIframe.src = url;
    }
}

function getMyLocation() {
    if (navigator.geolocation) {
        myLocationBtn.textContent = "Locating...";
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                mainMapIframe.src = `https://maps.google.com/maps?q=${lat},${lon}&hl=en&z=15&output=embed`;
                myLocationBtn.textContent = "My Location";
            },
            (error) => {
                console.error("Error getting location:", error);
                alert("Unable to retrieve your location. Please check your browser permissions.");
                myLocationBtn.textContent = "My Location";
            }
        );
    } else {
        alert("Geolocation is not supported by your browser.");
    }
}

mapSearchBtn.addEventListener("click", () => {
    const location = mapInput.value.trim();
    updateMap(location);
});

myLocationBtn.addEventListener("click", getMyLocation);

mapInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        const location = mapInput.value.trim();
        updateMap(location);
    }
});

const churches = {
    "17.6133,121.7270": { name: "St. Ignatius Cathedral", location: "Tuguegarao", history: "St. Ignatius Cathedral, also known as the Tuguegarao Cathedral, is the seat of the Archdiocese of Tuguegarao. It was founded in 1604 by Spanish missionaries and is one of the oldest churches in Northern Luzon. The cathedral features a unique architectural blend of Spanish colonial and Filipino styles, with its iconic red brick facade making it stand out among other churches in the region.", image: "pics/church/St. Ignatius Cathedral, Tuguegarao.jpg" },
    "17.6162,121.7269": { name: "St. Peter Paul Parish Church", location: "Tuguegarao", history: "St. Peter Paul Parish Church, commonly known as the Baculod Church, is one of the oldest parishes in Cagayan. Established in 1596, it served as the original seat of the diocese before the construction of St. Ignatius Cathedral. The church is famous for its centuries-old bells and the miraculous image of Our Lady of the Pillar.", image: "pics/church/St. Peter Paul Parish Church, Tuguegarao.jpg" },
    "17.7411,121.4543": { name: "Our Lady of the Pillar Church", location: "Tuao", history: "Our Lady of the Pillar Church in Tuao is renowned as the oldest church in Cagayan Province. Founded in 1585, it houses the revered image of Our Lady of the Pillar, believed to have been brought by Spanish missionaries. The church features a beautiful baroque altar and is a popular pilgrimage site for devotees.", image: "pics/church/Our Lady of the Pillar Church, Tuaid.jpg" },
    "18.3566,121.6406": { name: "San Sebastian Cathedral", location: "Aparri", history: "San Sebastian Cathedral in Aparri is the seat of the Diocese of Aparri. Built in 1612, it is dedicated to St. Sebastian, the martyr. The cathedral played a significant role during the Spanish colonial period as a center for evangelization in the northernmost part of the Philippines. Its towering spire is visible from miles away.", image: "pics/church/San Sebastian Cathedral, Aparri.jpg" },
    "17.9631,121.7543": { name: "St. John the Baptist Church", location: "Gattaran", history: "St. John the Baptist Church in Gattaran was established in 1614 by Spanish Dominican missionaries. The church is known for its impressive stone architecture and houses ancient religious artifacts. The annual feast of St. John the Baptist draws thousands of pilgrims who participate in the traditional fluvial procession.", image: "pics/church/St. John the Baptist Church, Gattaran.jpg" },
    "17.6436,121.7876": { name: "St. James the Greater Church", location: "Solana", history: "St. James the Greater Church in Solana, formerly known as the Church of Calasian, was founded in 1734. The church is famous for its life-sized image of St. James the Greater, also known as Santiago Matamoros. Every year, the town celebrates the Festivity of the Black Nazarene in honor of the saint.", image: "pics/church/St. James the Greater Church, Solana.jpg" },
    "17.9328,121.7931": { name: "St. Joseph Church", location: "Baggao", history: "St. Joseph Church in Baggao was established in 1605 and is one of the oldest churches in Cagayan Valley. The church is renowned for its beautiful stained glass windows depicting the life of St. Joseph. It serves as the spiritual center for the municipality and houses the venerated image of Our Lady of the Rosary.", image: "pics/church/St. Joseph Church, Baggao.png" },
    "19.2639,121.4801": { name: "Our Lady of La Naval Church", location: "Calayan", history: "Our Lady of La Naval Church in Calayan Island is dedicated to the Virgin of the Navy, the patroness of seafarers. Founded in 1614, the church was built to serve the spiritual needs of the island's fishing communities. The annual town fiesta honors Our Lady of La Naval with colorful processions and traditional celebrations.", image: "pics/church/Our Lady of La Naval, Calayan.png" },
    "18.4379,121.4406": { name: "St. Vincent Ferrer Church", location: "Abulug", history: "St. Vincent Ferrer Church in Abulug was founded in 1734 and is dedicated to St. Vincent Ferrer, the famous Dominican preacher. The church features a unique clock tower that has been telling time for over a century. The annual fiesta celebrates the feast day of St. Vincent Ferrer with traditional Ilocano dances and songs.", image: "pics/church/St. Vincent Ferrer Church, Abulug.png" },
    "17.7466,121.7382": { name: "St. Augustine Church", location: "Iguig", history: "St. Augustine Church in Iguig, also known as the Iguig Church, was established in 1604. It is famous for its exquisite altar made of carved wood and ivory. The church houses the miraculous image of St. Augustine, which draws devotees from across the region. The church's bell tower offers a panoramic view of the Cagayan River valley.", image: "pics/church/St. Augustine Church, Iguig.png" },
    "18.2042,121.9363": { name: "St. Michael the Archangel Church", location: "Lal-lo", history: "St. Michael the Archangel Church in Lal-lo was founded in 1585, making it one of the oldest churches in the Philippines. The church is built on the site where the first Mass in Cagayan was celebrated. Its ancient architecture features thick walls and a coral stone facade. The church is home to the revered image of St. Michael the Archangel.", image: "pics/church/St. Michael the Archangel Church, Lal-lo.png" },
    "18.0919,121.7752": { name: "San Lorenzo Ruiz Church", location: "Claveria", history: "San Lorenzo Ruiz Church in Claveria was established in 1660 and was originally dedicated to St. Andrew. It was rededicated to San Lorenzo Ruiz, the first Filipino saint, in 1981. The church features a modern architectural design while maintaining its historical significance as a center of faith in the municipality.", image: "pics/church/San Lorenzo Ruiz Church, Claveria.png" },
    "17.8231,121.8455": { name: "St. Nicholas Church", location: "Camalan", history: "St. Nicholas Church in Camalan was founded in 1620 by Spanish missionaries. The church is known for its beautiful ceiling murals depicting biblical scenes. It houses the ancient image of St. Nicholas of Tolentine, which is believed to have miraculous powers. The annual town fiesta features traditional folk dances.", image: "pics/church/St. Nicholas Church, Camalan.png" },
    "17.6878,121.6924": { name: "St. Francis of Assisi Church", location: "Enrile", history: "St. Francis of Assisi Church in Enrile was established in 1646. The church is famous for its unique architecture featuring a blend of Spanish and native Filipino design elements. It houses the venerated image of St. Francis of Assisi, and the church's gardens contain ancient religious sculptures.", image: "pics/church/St. Francis of Assisi Church, Enrile.png" },
    "17.4504,121.7989": { name: "St. Rose of Lima Church", location: "San Mariano", history: "St. Rose of Lima Church in San Mariano was founded in 1726. Dedicated to St. Rose of Lima, the first saint of the Americas, the church features beautiful stained glass windows depicting her life. The annual feast day celebration includes processions and traditional cooking of local delicacies.", image: "pics/church/St. Rose of Lima Church, San Mariano.png" },
    "18.2833,121.5167": { name: "St. James Parish Church", location: "Allacapan", history: "St. James Parish Church in Allacapan was established in 1840. The church is dedicated to St. James the Greater and features a majestic bell tower. The annual fiesta celebrates the feast day with traditional Ilocano performances and religious activities.", image: "pics/church/St. James Parish Church, Allacapan.png" },
    "18.0638,121.6275": { name: "Our Lady of Guadalupe Church", location: "Lasam", history: "Our Lady of Guadalupe Church in Lasam was founded in 1734. It is dedicated to Our Lady of Guadalupe, the patroness of the Americas. The church features a beautiful retablo mayor and houses the miraculous image of the Virgin. The annual pilgrimage attracts devotees seeking blessings.", image: "pics/church/Our Lady of Guadalupe Church, Lasam.png" },
    "17.7869,121.4802": { name: "St. Anthony of Padua Church", location: "Piat", history: "St. Anthony of Padua Church in Piat is known as the shrine of the Our Lady of Piat, whose image was brought to the Philippines in 1604. The church is a major pilgrimage site, with thousands of devotees visiting each year to seek the intercession of the Virgin Mary. The feast day celebration is one of the largest religious gatherings in Cagayan.", image: "pics/church/St. Anthony of Padua Church, Piat.png" },
    "17.5469,121.7008": { name: "St. Jerome Church", location: "Rizal", history: "St. Jerome Church in Rizal was established in 1856. The church is dedicated to St. Jerome, the patron saint of translators and scholars. It features a unique architectural design with arched ceilings and coral stone walls. The church houses ancient liturgical books and religious artifacts.", image: "pics/church/St. Jerome Church, Rizal.png" },
    "18.2042,121.9363": { name: "Immaculate Conception Cathedral", location: "Lallo", history: "Immaculate Conception Cathedral in Lallo was founded in 1596 and served as the first cathedral of the Diocese of Nueva Segovia. It is one of the oldest churches in Northern Luzon, featuring a magnificent Spanish colonial architecture with thick adobe walls. The cathedral houses the venerated image of the Immaculate Conception and is a significant historical landmark.", image: "pics/church/Immaculate Conception Cathedral, Lallo.png" }
};

const churchDropdown = document.getElementById("church-dropdown");
churchDropdown.addEventListener("change", (e) => {
    const coords = e.target.value;
    if (coords && churches[coords]) {
        const church = churches[coords];
        
        document.querySelectorAll(".nav a").forEach(l => l.classList.remove("active"));
        document.querySelector('[data-section="map-section"]').classList.add("active");
        document.querySelectorAll("main > section").forEach(section => {
            section.style.display = "none";
        });
        document.getElementById("map-section").style.display = "block";
        
        updateMap(coords, true);
        
        document.getElementById("church-name").textContent = church.name + ", " + church.location;
        document.getElementById("church-history").textContent = church.history;
        
        const imgIndex = Array.from(churchDropdown.options).findIndex(opt => opt.value === coords);
        document.getElementById("church-image").src = church.image;
        document.getElementById("church-info").style.display = "block";
    } else {
        document.getElementById("church-info").style.display = "none";
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
    });
});

// Initialize with user's current location if possible, else use Manila as fallback
function init() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                fetchWeatherByCoords(lat, lon);
                mainMapIframe.src = `https://maps.google.com/maps?q=${lat},${lon}&hl=en&z=15&output=embed`;
            },
            () => {
                fetchWeatherByCity("Manila");
                updateMap("Manila");
            }
        );
    } else {
        fetchWeatherByCity("Manila");
        updateMap("Manila");
    }
}

init();
