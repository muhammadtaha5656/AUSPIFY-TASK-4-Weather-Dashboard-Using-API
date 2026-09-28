const WeatherAPI = {
  async searchLocations(query) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Location search failed.");
    const data = await response.json();
    return data.results || [];
  },

  async getWeather(latitude, longitude) {
    const params = new URLSearchParams({
      latitude,
      longitude,
      timezone: "auto",
      forecast_days: 7,
      current: [
        "temperature_2m", "relative_humidity_2m", "apparent_temperature",
        "is_day", "precipitation", "rain", "weather_code",
        "pressure_msl", "surface_pressure", "wind_speed_10m",
        "wind_direction_10m", "wind_gusts_10m", "visibility"
      ].join(","),
      hourly: [
        "temperature_2m", "relative_humidity_2m", "precipitation_probability",
        "precipitation", "weather_code", "wind_speed_10m", "uv_index"
      ].join(","),
      daily: [
        "weather_code", "temperature_2m_max", "temperature_2m_min",
        "apparent_temperature_max", "sunrise", "sunset",
        "precipitation_sum", "rain_sum", "precipitation_probability_max",
        "wind_speed_10m_max", "wind_gusts_10m_max", "uv_index_max"
      ].join(","),
      temperature_unit: "celsius",
      wind_speed_unit: "kmh",
      precipitation_unit: "mm"
    });

    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!response.ok) throw new Error("Weather service is temporarily unavailable.");
    return response.json();
  }
};
