const UI = {
  els: {},

  init() {
    const ids = [
      "dashboard","loading","errorState","errorTitle","errorMessage","retryBtn",
      "locationName","locationMeta","favoriteBtn","updatedTime","currentDate",
      "conditionBadge","weatherIcon","temperature","tempUnit","condition",
      "feelsLike","feelsUnit","humidity","wind","windUnit","pressure","visibility",
      "sunrise","sunset","sunProgress","todayHigh","todayLow","rainChance",
      "windGust","hourlyList","dailyList","uvIndex","uvText","windDirection",
      "windDirectionText","rainTotal","timezone","cityChips","apiStatus",
      "searchSuggestions","cityInput","weatherEffects"
    ];
    ids.forEach(id => this.els[id] = document.getElementById(id));
  },

  showLoading(show) {
    this.els.loading.classList.toggle("hidden", !show);
    if (show) this.els.errorState.classList.add("hidden");
  },

  showError(title, message) {
    this.els.errorTitle.textContent = title;
    this.els.errorMessage.textContent = message;
    this.els.errorState.classList.remove("hidden");
    this.els.loading.classList.add("hidden");
  },

  hideError() { this.els.errorState.classList.add("hidden"); },

  formatTemp(celsius, unit) {
    const value = unit === "F" ? (celsius * 9 / 5) + 32 : celsius;
    return Math.round(value);
  },

  formatWind(kmh, unit) {
    return unit === "F" ? Math.round(kmh / 1.60934) : Math.round(kmh);
  },

  iconFor(code, isDay = true) {
    if (code === 0) return isDay ? "☀" : "☾";
    if ([1,2,3].includes(code)) return isDay ? "⛅" : "☁";
    if ([45,48].includes(code)) return "≋";
    if ([51,53,55,56,57].includes(code)) return "☂";
    if ([61,63,65,66,67,80,81,82].includes(code)) return "🌧";
    if ([71,73,75,77,85,86].includes(code)) return "❄";
    if ([95,96,99].includes(code)) return "ϟ";
    return "•";
  },

  conditionFor(code) {
    const map = {
      0:"Clear sky",1:"Mainly clear",2:"Partly cloudy",3:"Overcast",
      45:"Fog",48:"Rime fog",51:"Light drizzle",53:"Drizzle",55:"Heavy drizzle",
      56:"Freezing drizzle",57:"Heavy freezing drizzle",61:"Light rain",63:"Rain",
      65:"Heavy rain",66:"Freezing rain",67:"Heavy freezing rain",71:"Light snow",
      73:"Snow",75:"Heavy snow",77:"Snow grains",80:"Rain showers",81:"Rain showers",
      82:"Heavy showers",85:"Snow showers",86:"Heavy snow showers",
      95:"Thunderstorm",96:"Thunderstorm + hail",99:"Severe thunderstorm"
    };
    return map[code] || "Unknown";
  },

  cardinal(degrees) {
    const dirs = ["N","NE","E","SE","S","SW","W","NW"];
    return dirs[Math.round(degrees / 45) % 8];
  },

  timeOnly(iso) {
    return new Date(iso).toLocaleTimeString([], { hour:"numeric", minute:"2-digit" });
  },

  dateOnly(iso, options = { weekday:"short", month:"short", day:"numeric" }) {
    return new Date(iso).toLocaleDateString([], options);
  },

  render(data, location, unit) {
    const { current, daily, hourly } = data;
    const e = this.els;
    const currentTemp = this.formatTemp(current.temperature_2m, unit);
    const feels = this.formatTemp(current.apparent_temperature, unit);

    e.locationName.textContent = location.name;
    e.locationMeta.textContent = `${location.country || ""}${location.admin1 ? " · " + location.admin1 : ""} · Local time`;
    e.updatedTime.textContent = this.timeOnly(new Date().toISOString());
    e.currentDate.textContent = new Date().toLocaleDateString([], {weekday:"long", month:"long", day:"numeric"});
    e.conditionBadge.textContent = this.conditionFor(current.weather_code);
    e.weatherIcon.textContent = this.iconFor(current.weather_code, current.is_day);
    e.temperature.textContent = currentTemp;
    e.tempUnit.textContent = `°${unit}`;
    e.condition.textContent = this.conditionFor(current.weather_code);
    e.feelsLike.textContent = feels;
    e.feelsUnit.textContent = `°${unit}`;
    e.humidity.textContent = Math.round(current.relative_humidity_2m);
    e.wind.textContent = this.formatWind(current.wind_speed_10m, unit);
    e.windUnit.textContent = unit === "F" ? "mph" : "km/h";
    e.pressure.textContent = Math.round(current.pressure_msl);
    e.visibility.textContent = current.visibility != null ? (current.visibility / 1000).toFixed(1) : "—";

    e.sunrise.textContent = this.timeOnly(daily.sunrise[0]);
    e.sunset.textContent = this.timeOnly(daily.sunset[0]);
    e.todayHigh.textContent = `${this.formatTemp(daily.temperature_2m_max[0], unit)}°`;
    e.todayLow.textContent = `${this.formatTemp(daily.temperature_2m_min[0], unit)}°`;
    e.rainChance.textContent = `${Math.round(daily.precipitation_probability_max[0] || 0)}%`;
    e.windGust.textContent = `${this.formatWind(daily.wind_gusts_10m_max[0] || 0, unit)} ${unit === "F" ? "mph" : "km/h"}`;

    const uv = Math.round(daily.uv_index_max[0] || 0);
    e.uvIndex.textContent = uv;
    e.uvText.textContent = uv <= 2 ? "Low exposure" : uv <= 5 ? "Moderate exposure" : uv <= 7 ? "High exposure" : "Very high";
    e.windDirection.textContent = `${this.cardinal(current.wind_direction_10m)} ${Math.round(current.wind_direction_10m)}°`;
    e.windDirectionText.textContent = "Current wind direction";
    e.rainTotal.textContent = `${(daily.precipitation_sum[0] || 0).toFixed(1)} mm`;
    e.timezone.textContent = data.timezone || "Local";

    this.renderHourly(hourly, current, unit);
    this.renderDaily(daily, unit);
    this.updateEffects(current.weather_code);
  },

  renderHourly(hourly, current, unit) {
    const e = this.els;
    const now = new Date();
    let start = hourly.time.findIndex(t => new Date(t) >= now);
    if (start < 0) start = 0;
    const items = hourly.time.slice(start, start + 12);

    e.hourlyList.innerHTML = items.map((time, i) => {
      const index = start + i;
      const temp = this.formatTemp(hourly.temperature_2m[index], unit);
      const rain = Math.round(hourly.precipitation_probability[index] || 0);
      const isNow = i === 0;
      return `<div class="hour-card ${isNow ? "active" : ""}">
        <div class="hour-time">${isNow ? "NOW" : this.timeOnly(time)}</div>
        <div class="hour-icon">${this.iconFor(hourly.weather_code[index], true)}</div>
        <div class="hour-temp">${temp}°</div>
        <div class="hour-rain">☂ ${rain}%</div>
      </div>`;
    }).join("");
  },

  renderDaily(daily, unit) {
    const e = this.els;
    e.dailyList.innerHTML = daily.time.map((date, i) => {
      const name = i === 0 ? "Today" : new Date(date).toLocaleDateString([], {weekday:"long"});
      return `<div class="day-row">
        <div><span class="day-name">${name}</span><span class="day-date">${this.dateOnly(date)}</span></div>
        <div class="day-icon">${this.iconFor(daily.weather_code[i], true)}</div>
        <div class="day-condition">${this.conditionFor(daily.weather_code[i])}</div>
        <div class="temp-range"><span>${this.formatTemp(daily.temperature_2m_max[i], unit)}°</span><span>${this.formatTemp(daily.temperature_2m_min[i], unit)}°</span></div>
        <div class="rain-percent">☂ ${Math.round(daily.precipitation_probability_max[i] || 0)}%</div>
      </div>`;
    }).join("");
  },

  renderCities(cities, currentKey, favorites) {
    const e = this.els;
    if (!cities.length) {
      e.cityChips.innerHTML = `<span class="empty-chips">Search for a city to create your quick-access list.</span>`;
      return;
    }
    e.cityChips.innerHTML = cities.map(city => {
      const star = favorites.includes(city.key) ? "★ " : "";
      return `<button class="city-chip" data-key="${city.key}" data-lat="${city.latitude}" data-lon="${city.longitude}" data-name="${encodeURIComponent(city.name)}">${star}${city.name}</button>`;
    }).join("");
  },

  setFavorite(active) {
    this.els.favoriteBtn.classList.toggle("active", active);
    this.els.favoriteBtn.textContent = active ? "★" : "☆";
  },

  showSuggestions(results) {
    const box = this.els.searchSuggestions;
    if (!results.length) { box.classList.add("hidden"); return; }
    box.innerHTML = results.map((r, i) =>
      `<button class="suggestion" data-index="${i}">${r.name}, ${r.country || ""}${r.admin1 ? " · " + r.admin1 : ""}</button>`
    ).join("");
    box.classList.remove("hidden");
  },

  hideSuggestions() { this.els.searchSuggestions.classList.add("hidden"); },

  updateEffects(code) {
    const wrap = this.els.weatherEffects;
    wrap.innerHTML = "";
    if ([51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99].includes(code)) {
      for (let i = 0; i < 28; i++) {
        const drop = document.createElement("i");
        drop.className = "raindrop";
        drop.style.left = `${Math.random() * 100}%`;
        drop.style.animationDelay = `${Math.random() * 1.5}s`;
        drop.style.animationDuration = `${.8 + Math.random() * .7}s`;
        wrap.appendChild(drop);
      }
    }
  }
};
