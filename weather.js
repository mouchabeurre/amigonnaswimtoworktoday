const label = {
  rainy: 'rainy',
  sunny: 'sunny',
  snow: 'flurries',
  cloud: 'cloudy',
  thunder: 'thunder-storm',
  sunrain: 'sun-shower',
};

class Weather {
  constructor() {
    this.state = null;
    this.local_key = 'meteo_store';
    this.weather;
    this.rain;
    this.snow;
    this.wind = {direction: null, strength: null};
    this.geoSuccess = this.geoSuccess.bind(this);
    this.setStateFromResult = this.setStateFromResult.bind(this);
    this.setLocalStorage = this.setLocalStorage.bind(this);
    this.getLocalStorage = this.getLocalStorage.bind(this);
    this.setState = this.setState.bind(this);
    this.init();
  }

  init() {
    const options = {enableHighAccuracy: true, timeout: 10000};
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        this.geoSuccess,
        this.geoError,
        options,
      );
    } else {
      alert('MARCHE PO');
    }
  }

  setState(data, coords) {
    const day_data = this.getDayDataArray(data);
    const coords_short = {
      latitude: coords.latitude,
      longitude: coords.longitude,
    };
    this.state = {
      date: this.getKeyFromDate(),
      data: day_data,
      coords: coords_short,
    };
    this.setLocalStorage(this.state);
  }

  geoError(err) {
    console.log(err);
  }

  async geoSuccess(pos) {
    const coords = pos.coords;
    const local_state = this.getLocalStorage();
    let data;
    let new_data;
    if (local_state) {
      const local_lat = local_state.coords.latitude;
      const local_long = local_state.coords.longitude;
      if (
        Math.abs(coords.latitude - local_lat) +
          Math.abs(coords.longitude - local_long) >
        0.3
      ) {
        data = await this.getForecast(coords);
        new_data = JSON.parse(data);
      } else {
        if (this.getKeyFromDate() != local_state.date) {
          data = await this.getForecast(coords);
          new_data = JSON.parse(data);
        } else {
          new_data = local_state;
        }
      }
    } else {
      data = await this.getForecast(coords);
      new_data = JSON.parse(data);
    }
    this.setState(new_data, coords);
    this.setStateFromResult(this.state.data);
  }

  getForecast(coords) {
    const url = `http://www.infoclimat.fr/public-api/gfs/json?_ll=${
      coords.latitude
    },${
      coords.longitude
    }&_auth=ARsFElUrASNWewM0DngAKVU9V2JcKgEmC3dVNgxpUC0FblY3VTVWMFM9USwAL1VjWHUGZQw3BjYKYVUtC3lTMgFrBWlVPgFmVjkDZg4hACtVe1c2XHwBJgtpVTsMYlAtBWdWOlU2VipTPVE1ADRVf1huBm4MLAYhCmhVNwtlUzkBZAVoVTcBZVY%2FA2cOIQArVWNXZVwwATwLPFU2DGhQMQU3VjNVYlY1UzlRMgAuVWRYbQZiDDQGOApgVToLblMvAX0FGFVFAX5WeQMjDmsAclV7V2JcPQFt&_c=05d09a4d9f965ff1537a0d7c0a3f7f60`;
    return new Promise((resolve, reject) => {
      let xhr = new XMLHttpRequest();
      xhr.open('GET', url);
      xhr.onload = function() {
        if (this.status >= 200 && this.status < 300) {
          resolve(xhr.response);
        } else {
          reject({
            status: this.status,
            statusText: xhr.statusText,
          });
        }
      };
      xhr.send();
    });
  }

  getDayDataArray(data) {
    const current_day_key = this.getKeyFromDate();
    let day_data = [];
    for (const key of Object.keys(data)) {
      const record = data[key];
      if (typeof record === 'object') {
        if (current_day_key == key.slice(0, 10)) {
          day_data.push(record);
        } else {
          break;
        }
      }
    }
    return day_data;
  }

  getLocalStorage() {
    const ser_state = localStorage.getItem(this.local_key);
    let state = null;
    if (ser_state) {
      const parsed_data = JSON.parse(ser_state);
      state = parsed_data.data.length != 0 ? parsed_data : null;
    }
    return state;
  }

  setLocalStorage(state) {
    const ser_state = JSON.stringify(state);
    localStorage.setItem(this.local_key, ser_state);
  }

  setStateFromResult(data) {
    const current_day_key = this.getKeyFromDate();
    let rain_cpt = 0;
    let temp_cpt = 0;
    let john_snow = false;
    let wind_cpt = {direction: 0, strength: 0};
    for (let record of data) {
      rain_cpt += parseFloat(record.pluie);
      temp_cpt += parseFloat(record.temperature['2m']);
      john_snow = !john_snow && record.risque_neige == 'oui' ? true : false;
      wind_cpt.direction += parseFloat(record.vent_direction['10m']);
      wind_cpt.strength += parseFloat(record.vent_moyen['10m']);
    }
    this.wind.direction = wind_cpt.direction / data.length;
    this.wind.strength = wind_cpt.strength / data.length;
    this.temperature = temp_cpt / data.length - 273.15;
    this.rain = rain_cpt;
    this.snow = john_snow;
  }

  getKeyFromDate() {
    const date = new Date();
    const years = date.getFullYear();
    const months = `${date.getMonth() + 1}`.padStart(2, '0');
    const days = `${date.getDate()}`.padStart(2, '0');
    return `${years}-${months}-${days}`;
  }
}

const meteo = new Weather();
