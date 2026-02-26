const API_KEY = 'e552c45c1336e79f22d82c11f73c9570';
const elements = {
    searchBtn: document.querySelector('#search-btn'),
    locationInput: document.querySelector('#location-search'),
    weatherInfo: document.querySelector('#weather-info'),
    forecastContainer: document.querySelector('#forecast-container'),
    locationsList: document.querySelector('#locations-list'),
    unitToggle: document.querySelector('#unit-toggle'),
    themeBtn: document.querySelector('#settings-btn'),
    toast: document.querySelector('#toast')
};

let currentUnit = localStorage.getItem('unit') || 'metric';
let weatherChart = null;
let savedLocations = JSON.parse(localStorage.getItem('savedLocations')) || [];

// Weather icon mapping
const weatherIcons = {
    '01d': 'fas fa-sun', '01n': 'fas fa-moon',
    '02d': 'fas fa-cloud-sun', '02n': 'fas fa-cloud-moon',
    '03d': 'fas fa-cloud', '03n': 'fas fa-cloud',
    '04d': 'fas fa-cloud', '04n': 'fas fa-cloud',
    '09d': 'fas fa-cloud-showers-heavy', '09n': 'fas fa-cloud-showers-heavy',
    '10d': 'fas fa-cloud-sun-rain', '10n': 'fas fa-cloud-moon-rain',
    '11d': 'fas fa-bolt', '11n': 'fas fa-bolt',
    '13d': 'fas fa-snowflake', '13n': 'fas fa-snowflake',
    '50d': 'fas fa-smog', '50n': 'fas fa-smog'
};

async function fetchWeatherData(location) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${location}&units=${currentUnit}&appid=${API_KEY}`
        );
        if (!response.ok) throw new Error('Location not found');
        const data = await response.json();
        updateUI(data);
        fetchForecastData(location);
        saveLocation(data.name);
    } catch (error) {
        showToast(error.message);
    }
}

async function fetchForecastData(location) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${location}&units=${currentUnit}&appid=${API_KEY}`
        );
        const data = await response.json();
        renderForecast(data);
        renderChart(data);
    } catch (error) {
        console.error('Forecast error:', error);
    }
}

function updateUI(data) {
    const temp = Math.round(data.main.temp);
    const unitSymbol = currentUnit === 'metric' ? '°C' : '°F';
    const icon = weatherIcons[data.weather[0].icon] || 'fas fa-cloud';

    // Smooth transition for background based on weather
    const mainCondition = data.weather[0].main.toLowerCase();
    if (mainCondition.includes('clear')) document.body.style.background = 'var(--clear-sky)';
    else if (mainCondition.includes('cloud')) document.body.style.background = 'var(--cloudy)';
    else if (mainCondition.includes('rain')) document.body.style.background = 'var(--rainy)';
    else document.body.style.background = 'var(--primary-gradient)';

    elements.weatherInfo.innerHTML = `
        <div class="location-name">${data.name}, ${data.sys.country}</div>
        <div class="weather-desc">${data.weather[0].description}</div>
        <div class="weather-icon-main">
            <i class="${icon}"></i>
        </div>
        <div class="current-temp">${temp}${unitSymbol}</div>
        <div class="weather-details">
            <div class="detail-item">
                <i class="fas fa-temperature-high"></i>
                <div class="detail-info">
                    <span>Feels Like</span>
                    <strong>${Math.round(data.main.feels_like)}${unitSymbol}</strong>
                </div>
            </div>
            <div class="detail-item">
                <i class="fas fa-tint"></i>
                <div class="detail-info">
                    <span>Humidity</span>
                    <strong>${data.main.humidity}%</strong>
                </div>
            </div>
            <div class="detail-item">
                <i class="fas fa-wind"></i>
                <div class="detail-info">
                    <span>Wind</span>
                    <strong>${data.wind.speed} ${currentUnit === 'metric' ? 'm/s' : 'mph'}</strong>
                </div>
            </div>
            <div class="detail-item">
                <i class="fas fa-compress-alt"></i>
                <div class="detail-info">
                    <span>Pressure</span>
                    <strong>${data.main.pressure} hPa</strong>
                </div>
            </div>
        </div>
    `;
}

function renderForecast(data) {
    elements.forecastContainer.innerHTML = '';
    const dailyData = data.list.filter(item => item.dt_txt.includes('12:00:00')).slice(0, 5);

    dailyData.forEach(day => {
        const date = new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' });
        const icon = weatherIcons[day.weather[0].icon] || 'fas fa-cloud';

        const dayEl = document.createElement('div');
        dayEl.className = 'forecast-day';
        dayEl.innerHTML = `
            <span class="date">${date}</span>
            <i class="${icon}"></i>
            <div class="temp">${Math.round(day.main.temp)}°</div>
        `;
        elements.forecastContainer.appendChild(dayEl);
    });
}

function renderChart(data) {
    const ctx = document.getElementById('tempChart').getContext('2d');
    const labels = data.list.slice(0, 8).map(item => {
        return new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });
    const temps = data.list.slice(0, 8).map(item => item.main.temp);

    if (weatherChart) weatherChart.destroy();

    weatherChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperature Trend',
                data: temps,
                borderColor: '#00f2fe',
                backgroundColor: 'rgba(0, 242, 254, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#00f2fe',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#fff' } },
                x: { grid: { display: false }, ticks: { color: '#fff' } }
            }
        }
    });
}

function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.style.display = 'block';
    elements.toast.style.opacity = '1';
    setTimeout(() => {
        elements.toast.style.opacity = '0';
        setTimeout(() => elements.toast.style.display = 'none', 500);
    }, 3000);
}

function saveLocation(location) {
    if (!savedLocations.includes(location)) {
        savedLocations.push(location);
        localStorage.setItem('savedLocations', JSON.stringify(savedLocations));
        renderSavedLocations();
    }
}

function renderSavedLocations() {
    elements.locationsList.innerHTML = savedLocations.map(loc => `
        <li onclick="fetchWeatherData('${loc}')">
            <span><i class="fas fa-map-marker-alt"></i> ${loc}</span>
            <i class="fas fa-chevron-right"></i>
        </li>
    `).join('');
}

// Initial Events
elements.searchBtn.addEventListener('click', () => {
    const loc = elements.locationInput.value.trim();
    if (loc) fetchWeatherData(loc);
});

elements.locationInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const loc = elements.locationInput.value.trim();
        if (loc) fetchWeatherData(loc);
    }
});

elements.unitToggle.addEventListener('click', () => {
    currentUnit = currentUnit === 'metric' ? 'imperial' : 'metric';
    elements.unitToggle.textContent = currentUnit === 'metric' ? '°C' : '°F';
    localStorage.setItem('unit', currentUnit);
    const lastLoc = localStorage.getItem('lastLocation') || 'London';
    fetchWeatherData(lastLoc);
});

elements.themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    elements.themeBtn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});

document.addEventListener('DOMContentLoaded', () => {
    elements.unitToggle.textContent = currentUnit === 'metric' ? '°C' : '°F';
    renderSavedLocations();
    fetchWeatherData(localStorage.getItem('lastLocation') || 'London');
});
