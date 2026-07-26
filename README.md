# Premium Weather Web Application

A modern, highly animated, premium UI weather dashboard built using Python, Flask, and Vanilla JavaScript. Upgraded to include Air Quality, 5-Day Forecast, Hourly Forecast, and a Glassmorphism design.

## Features
- **Default City:** Loads Jaipur automatically.
- **Premium Dashboard:** Detailed 5-Day Forecast, 24-Hour horizontal scroll, UV Index, AQI.
- **Dynamic Backgrounds:** Background animates and changes based on weather conditions (Rain, Snow, Sunny, etc.).
- **Map Integration:** Leaflet.js map with light/dark theme toggling.
- **Extra Features:** Dark/Light theme toggle, Search history (local storage), Live digital clock.
- **Zero Frontend Frameworks:** Built cleanly with Vanilla HTML/CSS/JS.

## Folder Structure
```
Weather-Web-App/
├── app.py
├── requirements.txt
├── README.md
├── .gitignore
├── templates/
│      └── index.html
├── static/
│      ├── css/
│      │      └── style.css
│      └── js/
│             └── script.js
```

## Installation

1. Ensure Python 3 is installed on your system.
2. Clone or download this repository.
3. Open a terminal in the project directory.
4. (Optional but recommended) Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```
5. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## How to Run

1. Run the Flask application:
   ```bash
   python app.py
   ```
2. Open your web browser and navigate to:
   ```
   http://127.0.0.1:5000/
   ```

## Screenshots Placeholder
*(Add your screenshots here)*

## Technologies Used
- **Backend:** Python 3, Flask, Requests
- **Frontend:** HTML5, CSS3 (Vanilla), JavaScript (Vanilla)
- **APIs:** Open-Meteo Weather API, Open-Meteo Geocoding API, Open-Meteo Air Quality API
- **Map:** Leaflet.js

## License
MIT License
