/**
 * Premium Weather Dashboard Logic
 */

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. Digital Clock
    // ==========================================
    const clockElement = document.getElementById('digitalClock');
    function updateClock() {
        const now = new Date();
        clockElement.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    setInterval(updateClock, 1000);
    updateClock();

    // ==========================================
    // 2. Theme Toggle (Light / Dark)
    // ==========================================
    const themeToggleBtn = document.getElementById('themeToggle');
    const htmlEl = document.documentElement;
    const themeIcon = themeToggleBtn.querySelector('i');

    const currentTheme = localStorage.getItem('theme') || 'dark';
    setTheme(currentTheme);

    themeToggleBtn.addEventListener('click', () => {
        const newTheme = htmlEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });

    function setTheme(theme) {
        htmlEl.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        if (theme === 'dark') {
            themeIcon.className = 'fa-solid fa-moon';
        } else {
            themeIcon.className = 'fa-solid fa-sun';
        }
        
        // Update Map tiles if map exists
        if (window.weatherMap) {
            updateMapTiles(theme);
        }
    }

    // ==========================================
    // 3. Search History (LocalStorage)
    // ==========================================
    const searchForm = document.getElementById('searchForm');
    const cityInput = document.getElementById('cityInput');
    const btnLoader = document.getElementById('btnLoader');
    const btnIcon = searchForm.querySelector('.btn-icon');
    const searchDropdown = document.getElementById('searchDropdown');
    const historyList = document.getElementById('historyList');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');

    let history = JSON.parse(localStorage.getItem('weatherHistory')) || [];

    function renderHistory() {
        historyList.innerHTML = '';
        if (history.length === 0) {
            historyList.innerHTML = '<li style="color:var(--text-secondary);justify-content:center;cursor:default;">No recent searches</li>';
            return;
        }
        history.forEach(city => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fa-solid fa-clock-rotate-left"></i> ${city}`;
            li.addEventListener('click', () => {
                cityInput.value = city;
                searchForm.submit();
            });
            historyList.appendChild(li);
        });
    }

    cityInput.addEventListener('focus', () => {
        renderHistory();
        searchDropdown.classList.add('active');
    });

    // Hide dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchForm.contains(e.target) && !searchDropdown.contains(e.target)) {
            searchDropdown.classList.remove('active');
        }
    });

    clearHistoryBtn.addEventListener('click', () => {
        history = [];
        localStorage.setItem('weatherHistory', JSON.stringify(history));
        renderHistory();
    });

    searchForm.addEventListener('submit', (e) => {
        const val = cityInput.value.trim();
        if (val) {
            // Remove if exists, add to front, keep max 5
            history = history.filter(c => c.toLowerCase() !== val.toLowerCase());
            history.unshift(val);
            if (history.length > 5) history.pop();
            localStorage.setItem('weatherHistory', JSON.stringify(history));
        }

        btnIcon.style.display = 'none';
        btnLoader.style.display = 'block';
    });

    // ==========================================
    // 4. Dynamic Backgrounds
    // ==========================================
    const dynamicBg = document.getElementById('dynamic-bg');
    const weatherCodeInput = document.getElementById('weatherCode');
    const isDayInput = document.getElementById('isDay');

    if (weatherCodeInput && isDayInput) {
        const code = parseInt(weatherCodeInput.value);
        const isDay = parseInt(isDayInput.value);
        
        let bgClass = 'circle-bg'; // Default circles
        
        // Define weather mapping
        if (code === 0 || code === 1) bgClass = isDay ? 'bg-sunny' : 'circle-bg';
        else if (code >= 51 && code <= 67) bgClass = 'bg-rain';
        else if (code >= 71 && code <= 86) bgClass = 'bg-snow';
        else if (code >= 95 && code <= 99) bgClass = 'bg-rain'; // thunderstorm uses rain bg for now
        else if (code === 45 || code === 48) bgClass = 'circle-bg'; // fog

        if (bgClass !== 'circle-bg') {
            dynamicBg.className = `dynamic-bg ${bgClass}`;
        } else {
            dynamicBg.innerHTML = '<div class="circle-bg c1"></div><div class="circle-bg c2"></div>';
        }
    } else {
        dynamicBg.innerHTML = '<div class="circle-bg c1"></div><div class="circle-bg c2"></div>';
    }

    // ==========================================
    // 5. Extra Features (Share & Fav)
    // ==========================================
    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            const cityName = document.getElementById('cityNameDisplay').innerText;
            const temp = document.querySelector('.huge-temp').innerText;
            const desc = document.querySelector('.condition-desc').innerText;
            
            const textToCopy = `Weather in ${cityName}: ${temp}, ${desc}. via Premium Weather Dashboard`;
            navigator.clipboard.writeText(textToCopy).then(() => {
                alert('Weather details copied to clipboard!');
            });
        });
    }

    const favBtn = document.getElementById('favBtn');
    if (favBtn) {
        favBtn.addEventListener('click', () => {
            const cityName = document.getElementById('mapCity').value;
            favBtn.querySelector('i').className = 'fa-solid fa-star';
            favBtn.querySelector('i').style.color = '#eab308';
            alert(`${cityName} added to favorites! (Visual demo)`);
        });
    }

    // ==========================================
    // 6. Leaflet Map Initialization
    // ==========================================
    const mapElement = document.getElementById('map');
    
    // Store tile layers globally to switch them
    let darkTiles, lightTiles, currentLayer;
    
    window.updateMapTiles = function(theme) {
        if (!window.weatherMap) return;
        
        if (currentLayer) window.weatherMap.removeLayer(currentLayer);
        
        if (theme === 'dark') {
            currentLayer = darkTiles;
        } else {
            currentLayer = lightTiles;
        }
        currentLayer.addTo(window.weatherMap);
    };
    
    if (mapElement) {
        const latInput = document.getElementById('mapLat');
        const lonInput = document.getElementById('mapLon');
        const cityInput = document.getElementById('mapCity');
        
        if (latInput && lonInput) {
            const lat = parseFloat(latInput.value);
            const lon = parseFloat(lonInput.value);
            const cityName = cityInput ? cityInput.value : 'Location';
            
            window.weatherMap = L.map('map', {
                zoomControl: true,
                attributionControl: false
            }).setView([lat, lon], 11);
            
            // Define Tile Layers
            darkTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 20 });
            lightTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { maxZoom: 20 });
            
            // Set initial tiles
            updateMapTiles(htmlEl.getAttribute('data-theme'));
            
            // Custom Marker
            const customIcon = L.divIcon({
                className: 'custom-div-icon',
                html: '<div style="background-color: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });
            
            L.marker([lat, lon], { icon: customIcon })
                .addTo(window.weatherMap)
                .bindPopup(`<b>${cityName}</b>`)
                .openPopup();
        }
    }
});
