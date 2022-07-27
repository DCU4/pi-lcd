const axios = require('axios')
const LCD = require('@oawu/lcd1602');
const sensorTemp = require("node-dht-sensor").promises;
const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
const dayOptions = { weekday: 'long' };
const date = new Date().toLocaleDateString('en-US', options);
const day = new Date().toLocaleDateString('en-US', dayOptions);
const lcd = new LCD();
let index = 0;
let lcdOptions = ['pihole', 'indoor', 'outdoor'];

setInterval(function () {

  let option = lcdOptions[index++ % lcdOptions.length]

  if (option == 'pihole') {
    getPiHoleData()
      .then(res => {
        // console.log({res});
        lcd.clear();
        lcd.text(0, 0, 'Blocked:');
        lcd.text(1, 0, 'Queries:');
        lcd.text(0, 11, res.ads_blocked_today + '   ');
        lcd.text(1, 11, res.dns_queries_today + '   ');
      })
      .catch(err => {
        lcd.text(0, 0, 'getPiHoleData error!');
        console.log(err)
      });
  } else if (option == 'indoor') {
    readIndoorTemp()
      .then(res => {
        lcd.clear();
        lcd.text(0, 0, res.temp + '   ');
        lcd.text(1, 0, res.hum + '   ');
        lcd.text(0, 7, day + '   ');
        lcd.text(1, 7, date + '   ');
      })
      .catch(err => {
        lcd.text(0, 0, 'readIndoorTemp error!');
        console.log(err)
      });
  } else {
    readOutdoorTemp()
      .then(res => {
        lcd.clear();
        lcd.text(0, 0, res.main.temp + 'F  ');
        lcd.text(1, 0, res.main.humidity + '%  ');
        lcd.text(0, 8, res.weather[0].main);
        lcd.text(1, 8, res.weather[0].description);
      })
      .catch(err => {
        lcd.text(0, 0, 'readOutdoorTemp error!');
        console.log(err)
      });
  }

}, 5000);



// functions
const readIndoorTemp = async () => {
  sensorTemp.initialize(11, 25);
  const dataObj = await sensorTemp.read(11, 25)
  dataObj.temp = `${(dataObj.temperature.toFixed(1) * 9 / 5) + 32}F`;
  dataObj.hum = `${dataObj.humidity.toFixed(1)}%`;
  count++;
  return dataObj
}

const readOutdoorTemp = async () => {
  const API_KEY = 'secret';
  const city = 'Washington, D.C.';
  const country = 'USA';
  const dataObj = await axios(`https://api.openweathermap.org/data/2.5/weather?q=${city},${country}&appid=${API_KEY}&units=imperial`);
  return dataObj.data;
}

const getPiHoleData = async () => {
  const call = await axios(`http://192.168.1.158/admin/api.php?summary`);
  return call.data;
}