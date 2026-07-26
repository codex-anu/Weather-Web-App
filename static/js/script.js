/**
 * Premium Weather Dashboard Logic - Student Portfolio Edition
 */

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. Toast Notification (Welcome Message)
    // ==========================================
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    const cityInputForToast = document.getElementById('mapCity');
    
    if (cityInputForToast && cityInputForToast.value) {
        toastMsg.innerText = `Weather data loaded for ${cityInputForToast.value}!`;
    }
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
        // Hide toast after 4 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }, 500);


    // ==========================================
    // 2. Scroll to Top Button
    // ==========================================
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    });

    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });


    // ==========================================
    // 3. Digital Clock
    // ==========================================
    const clockElement = document.getElementById('digitalClock');
    function updateClock() {
        const now = new Date();
        clockElement.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    setInterval(updateClock, 1000);
    updateClock();


    // ==========================================
    // 4. Theme Toggle (Light / Dark)
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
        if (window.weatherMap && window.updateMapTiles) {
            window.updateMapTiles(theme);
        }
    }


    // ==========================================
    // 5. Search History & Form Handling
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
                btnIcon.style.display = 'none';
                btnLoader.style.display = 'block';
            });
            historyList.appendChild(li);
        });
    }

    cityInput.addEventListener('focus', () => {
        renderHistory();
        searchDropdown.classList.add('active');
    });

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
            history = history.filter(c => c.toLowerCase() !== val.toLowerCase());
            history.unshift(val);
            if (history.length > 5) history.pop();
            localStorage.setItem('weatherHistory', JSON.stringify(history));
        }
        btnIcon.style.display = 'none';
        btnLoader.style.display = 'block';
    });


    // ==========================================
    // 6. Dynamic Backgrounds (Weather Based)
    // ==========================================
    const dynamicBg = document.getElementById('dynamic-bg');
    const weatherCodeInput = document.getElementById('weatherCode');
    const isDayInput = document.getElementById('isDay');

    if (weatherCodeInput && isDayInput) {
        const code = parseInt(weatherCodeInput.value);
        const isDay = parseInt(isDayInput.value);
        
        let bgClass = ''; 
        
        // Match Weather Codes to Background CSS Classes
        if (code === 0 || code === 1) bgClass = isDay ? 'bg-sunny' : 'bg-night';
        else if (code === 2 || code === 3) bgClass = 'bg-cloudy';
        else if (code >= 51 && code <= 67) bgClass = 'bg-rain';
        else if (code >= 71 && code <= 86) bgClass = 'bg-snow';
        else if (code >= 95 && code <= 99) bgClass = 'bg-thunder';
        else if (code === 45 || code === 48) bgClass = 'bg-cloudy'; // fog
        else bgClass = isDay ? '' : 'bg-night'; // fallback

        if (bgClass) {
            dynamicBg.className = `dynamic-bg ${bgClass}`;
        } else {
            dynamicBg.className = 'dynamic-bg'; // Default gradient handles it nicely
        }
    }


    // ==========================================
    // 7. Extra Features (Copy & Favorite)
    // ==========================================
    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            const cityName = document.getElementById('cityNameDisplay').innerText;
            const temp = document.querySelector('.huge-temp').innerText;
            const desc = document.querySelector('.condition').innerText;
            
            const textToCopy = `Weather in ${cityName}: ${temp}, ${desc}.`;
            navigator.clipboard.writeText(textToCopy).then(() => {
                toastMsg.innerText = 'Weather details copied!';
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 3000);
            });
        });
    }

    const favBtn = document.getElementById('favBtn');
    if (favBtn) {
        favBtn.addEventListener('click', () => {
            const icon = favBtn.querySelector('i');
            if (icon.classList.contains('fa-regular')) {
                icon.className = 'fa-solid fa-star';
                icon.style.color = '#fde047'; // Yellow
                toastMsg.innerText = 'Added to Favorites!';
            } else {
                icon.className = 'fa-regular fa-star';
                icon.style.color = '';
                toastMsg.innerText = 'Removed from Favorites!';
            }
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3000);
        });
    }


    // ==========================================
    // 8. Leaflet Map Initialization
    // ==========================================
    const mapElement = document.getElementById('map');
    let darkTiles, lightTiles, currentLayer;
    
    window.updateMapTiles = function(theme) {
        if (!window.weatherMap) return;
        if (currentLayer) window.weatherMap.removeLayer(currentLayer);
        
        currentLayer = theme === 'dark' ? darkTiles : lightTiles;
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
            }).setView([lat, lon], 10);
            
            // CartoDB tiles are beautiful and free for student projects
            darkTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 20 });
            lightTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { maxZoom: 20 });
            
            updateMapTiles(htmlEl.getAttribute('data-theme'));
            
            const customIcon = L.divIcon({
                className: 'custom-div-icon',
                html: '<div style="background-color: #38bdf8; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px rgba(56, 189, 248, 0.9);"></div>',
                iconSize: [22, 22],
                iconAnchor: [11, 11]
            });
            
            L.marker([lat, lon], { icon: customIcon })
                .addTo(window.weatherMap)
                .bindPopup(`<b>${cityName}</b>`)
                .openPopup();
        }
    }
});
