from flask import Flask, render_template, request
import requests
from datetime import datetime
import traceback

app = Flask(__name__)

# APIs
GEOCODE_API_URL = "https://geocoding-api.open-meteo.com/v1/search"
WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast"
AQI_API_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"

WEATHER_CODES = {
    0: {"desc": "Clear sky", "icon": "sun"},
    1: {"desc": "Mainly clear", "icon": "sun"},
    2: {"desc": "Partly cloudy", "icon": "cloud-sun"},
    3: {"desc": "Overcast", "icon": "cloud"},
    45: {"desc": "Fog", "icon": "smog"},
    48: {"desc": "Depositing rime fog", "icon": "smog"},
    51: {"desc": "Drizzle: Light", "icon": "cloud-rain"},
    53: {"desc": "Drizzle: Moderate", "icon": "cloud-rain"},
    55: {"desc": "Drizzle: Dense", "icon": "cloud-showers-heavy"},
    56: {"desc": "Freezing Drizzle: Light", "icon": "snowflake"},
    57: {"desc": "Freezing Drizzle: Dense", "icon": "snowflake"},
    61: {"desc": "Rain: Slight", "icon": "cloud-rain"},
    63: {"desc": "Rain: Moderate", "icon": "cloud-showers-heavy"},
    65: {"desc": "Rain: Heavy", "icon": "cloud-showers-heavy"},
    66: {"desc": "Freezing Rain: Light", "icon": "snowflake"},
    67: {"desc": "Freezing Rain: Heavy", "icon": "snowflake"},
    71: {"desc": "Snow fall: Slight", "icon": "snowflake"},
    73: {"desc": "Snow fall: Moderate", "icon": "snowflake"},
    75: {"desc": "Snow fall: Heavy", "icon": "snowflake"},
    77: {"desc": "Snow grains", "icon": "snowflake"},
    80: {"desc": "Rain showers: Slight", "icon": "cloud-rain"},
    81: {"desc": "Rain showers: Moderate", "icon": "cloud-showers-heavy"},
    82: {"desc": "Rain showers: Violent", "icon": "cloud-showers-heavy"},
    85: {"desc": "Snow showers: Slight", "icon": "snowflake"},
    86: {"desc": "Snow showers: Heavy", "icon": "snowflake"},
    95: {"desc": "Thunderstorm: Slight", "icon": "bolt"},
    96: {"desc": "Thunderstorm with hail", "icon": "bolt"},
    99: {"desc": "Thunderstorm with heavy hail", "icon": "bolt"}
}

def get_weather_info(code, is_day=1):
    info = WEATHER_CODES.get(code, {"desc": "Unknown", "icon": "cloud"})
    # Adjust icon for night time if clear
    if not is_day and info["icon"] == "sun":
        info = {"desc": info["desc"], "icon": "moon"}
    elif not is_day and info["icon"] == "cloud-sun":
        info = {"desc": info["desc"], "icon": "cloud-moon"}
    return info

@app.route("/", methods=["GET", "POST"])
def index():
    weather_data = None
    error = None

    city = "Jaipur"
    if request.method == "POST":
        post_city = request.form.get("city")
        if post_city and post_city.strip():
            city = post_city.strip()
        else:
            error = "Please enter a valid city name."
            city = None
    
    if city:
        try:
            # 1. Geocoding
            geo_params = {"name": city, "count": 1, "language": "en", "format": "json"}
            geo_response = requests.get(GEOCODE_API_URL, params=geo_params)
            geo_response.raise_for_status()
            geo_data = geo_response.json()
            
            if "results" not in geo_data or len(geo_data["results"]) == 0:
                error = "City not found. Please try a valid city name."
            else:
                location = geo_data["results"][0]
                lat = location.get("latitude")
                lon = location.get("longitude")
                country = location.get("country", "")
                city_name = location.get("name", "")
                
                # 2. Weather
                weather_params = {
                    "latitude": lat,
                    "longitude": lon,
                    "current": "temperature_2m,apparent_temperature,is_day,relative_humidity_2m,wind_speed_10m,surface_pressure,visibility,cloud_cover,weather_code",
                    "hourly": "temperature_2m,weather_code,is_day",
                    "daily": "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max,wind_speed_10m_max",
                    "timezone": "auto",
                    "forecast_days": 6
                }
                
                w_resp = requests.get(WEATHER_API_URL, params=weather_params)
                w_resp.raise_for_status()
                w_data = w_resp.json()
                
                # 3. AQI
                aqi_params = {
                    "latitude": lat,
                    "longitude": lon,
                    "current": "european_aqi,pm10,pm2_5",
                    "timezone": "auto"
                }
                aqi_data = {"current": {}}
                try:
                    a_resp = requests.get(AQI_API_URL, params=aqi_params)
                    if a_resp.status_code == 200:
                        aqi_data = a_resp.json()
                except Exception:
                    pass
                
                # Parse Current
                cur = w_data.get("current", {})
                is_day = cur.get("is_day", 1)
                w_info = get_weather_info(cur.get("weather_code", 0), is_day)
                
                # Parse Daily (Next 5 Days)
                daily = w_data.get("daily", {})
                daily_forecast = []
                for i in range(1, 6): # Skip today (0), show next 5 days
                    try:
                        d_code = daily.get("weather_code", [])[i]
                        d_info = get_weather_info(d_code, 1) # Day icon for daily forecast
                        d_date = datetime.fromisoformat(daily.get("time", [])[i]).strftime("%a")
                        daily_forecast.append({
                            "day": d_date,
                            "min_temp": round(daily.get("temperature_2m_min", [])[i]),
                            "max_temp": round(daily.get("temperature_2m_max", [])[i]),
                            "rain_chance": daily.get("precipitation_probability_max", [])[i],
                            "wind": round(daily.get("wind_speed_10m_max", [])[i]),
                            "icon": d_info["icon"],
                            "desc": d_info["desc"]
                        })
                    except IndexError:
                        pass
                
                # Parse Hourly (Next 24 hours)
                hourly = w_data.get("hourly", {})
                hourly_forecast = []
                current_time = cur.get("time", "")
                
                if current_time and "time" in hourly:
                    try:
                        # Find index of current time
                        start_idx = hourly["time"].index(current_time)
                        for i in range(start_idx, start_idx + 24):
                            if i < len(hourly["time"]):
                                h_code = hourly["weather_code"][i]
                                h_is_day = hourly.get("is_day", [])[i] if "is_day" in hourly else 1
                                h_info = get_weather_info(h_code, h_is_day)
                                h_time_obj = datetime.fromisoformat(hourly["time"][i])
                                h_time_str = "Now" if i == start_idx else h_time_obj.strftime("%I %p")
                                hourly_forecast.append({
                                    "time": h_time_str,
                                    "temp": round(hourly["temperature_2m"][i]),
                                    "icon": h_info["icon"]
                                })
                    except ValueError:
                        pass
                
                # Today details
                sunrise_iso = daily.get("sunrise", [""])[0]
                sunset_iso = daily.get("sunset", [""])[0]
                sunrise = datetime.fromisoformat(sunrise_iso).strftime("%I:%M %p") if sunrise_iso else "N/A"
                sunset = datetime.fromisoformat(sunset_iso).strftime("%I:%M %p") if sunset_iso else "N/A"
                
                now = datetime.now()
                
                aqi_cur = aqi_data.get("current", {})
                
                weather_data = {
                    "city": city_name,
                    "country": country,
                    "lat": lat,
                    "lon": lon,
                    "temp": round(cur.get("temperature_2m", 0)),
                    "feels_like": round(cur.get("apparent_temperature", 0)),
                    "humidity": cur.get("relative_humidity_2m"),
                    "wind_speed": cur.get("wind_speed_10m"),
                    "pressure": cur.get("surface_pressure"),
                    "visibility": round(cur.get("visibility", 0) / 1000, 1), # km
                    "cloud_cover": cur.get("cloud_cover"),
                    "uv_index": daily.get("uv_index_max", [0])[0],
                    "desc": w_info["desc"],
                    "icon": w_info["icon"],
                    "is_day": is_day,
                    "weather_code": cur.get("weather_code", 0),
                    "sunrise": sunrise,
                    "sunset": sunset,
                    "date": now.strftime("%A, %d %b %Y"),
                    "last_updated": now.strftime("%I:%M %p"),
                    "aqi": aqi_cur.get("european_aqi", "N/A"),
                    "pm25": aqi_cur.get("pm2_5", "N/A"),
                    "pm10": aqi_cur.get("pm10", "N/A"),
                    "daily": daily_forecast,
                    "hourly": hourly_forecast
                }
                
        except requests.exceptions.RequestException as e:
            error = "Network error. Failed to fetch data from API."
        except Exception as e:
            traceback.print_exc()
            error = f"An unexpected error occurred: {str(e)}"
            
    return render_template("index.html", weather=weather_data, error=error)

if __name__ == "__main__":
    app.run(debug=True)
