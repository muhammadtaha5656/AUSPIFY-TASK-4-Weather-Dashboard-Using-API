# Auspify Weather Dashboard

A polished internship project for **Task 4 — Weather Dashboard Using API**.

## Features

- Real-time weather data
- City search with suggestions
- Current temperature and feels-like temperature
- Humidity, wind, pressure and visibility
- Sunrise and sunset
- 12-hour forecast
- 7-day forecast
- Rain probability
- UV index
- Wind direction
- Celsius / Fahrenheit toggle
- Browser location support
- Recent cities
- Favorite cities
- Dark / light theme
- Loading and error states
- Weather-based rain animation
- Responsive mobile design
- LocalStorage persistence

## APIs

This project uses the free Open-Meteo REST APIs:

- Geocoding API for city search
- Forecast API for current, hourly and daily weather

No API key is required.

## How to run

1. Download or clone the repository.
2. Open the folder in VS Code.
3. Use VS Code Live Server, or open `index.html` in a modern browser.
4. Search for any city.

For the best development experience, use Live Server because browser security policies can vary when opening local files directly.

## Project structure

```text
auspify-weather-dashboard/
├── index.html
├── README.md
├── css/
│   ├── style.css
│   └── responsive.css
├── js/
│   ├── weather-api.js
│   ├── ui.js
│   └── app.js
└── assets/
```

## Internship skills demonstrated

- REST API integration
- Fetch API
- JSON handling
- Async/Await
- DOM manipulation
- Responsive UI/UX
- Client-side state management
- LocalStorage
- Error handling
- Browser Geolocation API

## Important

The UI is intentionally separated from API logic so the project is easier to maintain and explain during an internship review.

## Design direction

The default experience uses a warm cream, beige and light-brown palette for a calm,
premium editorial feel. A dark theme remains available from the theme toggle.
