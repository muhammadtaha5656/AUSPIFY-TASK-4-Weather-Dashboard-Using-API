const App = {
  state: {
    unit: localStorage.getItem("auspify_unit") || "C",
    location: null,
    weather: null,
    lastQuery: "",
    cities: JSON.parse(localStorage.getItem("auspify_cities") || "[]"),
    favorites: JSON.parse(localStorage.getItem("auspify_favorites") || "[]")
  },

  async init() {
    UI.init();
    this.bindEvents();
    this.applyTheme(localStorage.getItem("auspify_theme") || "light");
    this.updateUnitButtons();
    UI.renderCities(this.state.cities, null, this.state.favorites);

    const saved = localStorage.getItem("auspify_last_location");
    if (saved) {
      try {
        const location = JSON.parse(saved);
        await this.loadLocation(location);
        return;
      } catch (_) {}
    }

    // Good first-run default; user can immediately search another city.
    await this.loadLocation({
      name: "Karachi",
      country: "Pakistan",
      admin1: "Sindh",
      latitude: 24.8607,
      longitude: 67.0011,
      key: "Karachi-24.8607-67.0011"
    });
  },

  bindEvents() {
    document.getElementById("searchForm").addEventListener("submit", e => {
      e.preventDefault();
      const query = UI.els.cityInput.value.trim();
      if (query) this.searchAndLoad(query);
    });

    let searchTimer;
    UI.els.cityInput.addEventListener("input", () => {
      clearTimeout(searchTimer);
      const query = UI.els.cityInput.value.trim();
      if (query.length < 2) return UI.hideSuggestions();
      searchTimer = setTimeout(() => this.previewSearch(query), 350);
    });

    UI.els.searchSuggestions.addEventListener("click", e => {
      const btn = e.target.closest(".suggestion");
      if (!btn) return;
      const result = this.previewResults[Number(btn.dataset.index)];
      UI.hideSuggestions();
      UI.els.cityInput.value = "";
      this.loadLocation(result);
    });

    document.addEventListener("click", e => {
      if (!e.target.closest(".search-wrap")) UI.hideSuggestions();
    });

    document.getElementById("locationBtn").addEventListener("click", () => this.useLocation());
    document.getElementById("retryBtn").addEventListener("click", () => {
      if (this.state.location) this.loadLocation(this.state.location);
    });

    document.getElementById("themeBtn").addEventListener("click", () => {
      const next = document.body.classList.contains("light") ? "dark" : "light";
      this.applyTheme(next);
    });

    document.querySelectorAll(".unit-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const unit = btn.dataset.unit;
        if (unit === this.state.unit || !this.state.weather) return;
        this.state.unit = unit;
        localStorage.setItem("auspify_unit", unit);
        this.updateUnitButtons();
        UI.render(this.state.weather, this.state.location, unit);
      });
    });

    UI.els.favoriteBtn.addEventListener("click", () => this.toggleFavorite());

    UI.els.cityChips.addEventListener("click", e => {
      const btn = e.target.closest(".city-chip");
      if (!btn) return;
      const city = this.state.cities.find(c => c.key === btn.dataset.key);
      if (city) this.loadLocation(city);
    });

    document.getElementById("clearCitiesBtn").addEventListener("click", () => {
      this.state.cities = [];
      localStorage.removeItem("auspify_cities");
      UI.renderCities([], null, this.state.favorites);
    });
  },

  async previewSearch(query) {
    try {
      this.previewResults = await WeatherAPI.searchLocations(query);
      UI.showSuggestions(this.previewResults);
    } catch (_) {
      UI.hideSuggestions();
    }
  },

  async searchAndLoad(query) {
    UI.showLoading(true);
    UI.hideSuggestions();
    try {
      const results = await WeatherAPI.searchLocations(query);
      if (!results.length) throw new Error("No matching city was found.");
      await this.loadLocation(results[0], true);
    } catch (error) {
      UI.showError("Location not found", error.message || "Please try another city.");
    }
  },

  async loadLocation(location, fromSearch = false) {
    UI.showLoading(true);
    try {
      const weather = await WeatherAPI.getWeather(location.latitude, location.longitude);
      this.state.location = {
        ...location,
        key: location.key || `${location.name}-${location.latitude}-${location.longitude}`
      };
      this.state.weather = weather;
      localStorage.setItem("auspify_last_location", JSON.stringify(this.state.location));

      this.rememberCity(this.state.location);
      UI.render(weather, this.state.location, this.state.unit);
      UI.setFavorite(this.state.favorites.includes(this.state.location.key));
      UI.hideError();
      UI.showLoading(false);
      UI.els.apiStatus.textContent = "Live data · Updated just now";
    } catch (error) {
      UI.showError("Weather unavailable", error.message || "Could not fetch weather data.");
    }
  },

  rememberCity(city) {
    this.state.cities = [
      city,
      ...this.state.cities.filter(c => c.key !== city.key)
    ].slice(0, 8);
    localStorage.setItem("auspify_cities", JSON.stringify(this.state.cities));
    UI.renderCities(this.state.cities, city.key, this.state.favorites);
  },

  toggleFavorite() {
    if (!this.state.location) return;
    const key = this.state.location.key;
    if (this.state.favorites.includes(key)) {
      this.state.favorites = this.state.favorites.filter(x => x !== key);
    } else {
      this.state.favorites.push(key);
    }
    localStorage.setItem("auspify_favorites", JSON.stringify(this.state.favorites));
    UI.setFavorite(this.state.favorites.includes(key));
    UI.renderCities(this.state.cities, key, this.state.favorites);
  },

  useLocation() {
    if (!navigator.geolocation) {
      UI.showError("Location unavailable", "Your browser does not support location access.");
      return;
    }
    UI.showLoading(true);
    navigator.geolocation.getCurrentPosition(
      async position => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const weather = await WeatherAPI.getWeather(lat, lon);
          const results = await WeatherAPI.searchLocations(`${lat},${lon}`).catch(() => []);
          const location = results[0] || {
            name: "Your location", country: "", admin1: "", latitude: lat, longitude: lon
          };
          this.state.location = {...location, latitude:lat, longitude:lon, key:`current-${lat.toFixed(3)}-${lon.toFixed(3)}`};
          this.state.weather = weather;
          localStorage.setItem("auspify_last_location", JSON.stringify(this.state.location));
          this.rememberCity(this.state.location);
          UI.render(weather, this.state.location, this.state.unit);
          UI.setFavorite(this.state.favorites.includes(this.state.location.key));
          UI.showLoading(false);
        } catch (error) {
          UI.showError("Could not load location", error.message);
        }
      },
      () => UI.showError("Location permission needed", "Allow location access in your browser, or search for a city manually.")
    );
  },

  applyTheme(theme) {
    document.body.classList.toggle("light", theme === "light");
    document.getElementById("themeBtn").textContent = theme === "light" ? "☀" : "☾";
    localStorage.setItem("auspify_theme", theme);
  },

  updateUnitButtons() {
    document.querySelectorAll(".unit-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.unit === this.state.unit);
    });
  }
};

document.addEventListener("DOMContentLoaded", () => App.init());
