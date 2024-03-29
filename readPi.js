const axios = require('axios')
const LCD = require('@oawu/lcd1602');
const sensorTemp = require("node-dht-sensor").promises;
const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
const dayOptions = { weekday: 'long' };
const date = new Date().toLocaleDateString('en-US', options);
const day = new Date().toLocaleDateString('en-US', dayOptions);
const lcd = new LCD();
let intervalId;
// const express = require('express');
// const app = express();
// const http = require('http').createServer(app);
// const io = require('socket.io')(http);


// functions
const readIndoorTemp = async () => {
  sensorTemp.initialize(11, 25);
  const dataObj = await sensorTemp.read(11, 25)
  dataObj.temp = `${(dataObj.temperature.toFixed(1) * 9 / 5) + 32}F`;
  dataObj.hum = `${dataObj.humidity.toFixed(1)}%`;
  return dataObj
}

const readOutdoorTemp = async () => {
  const API_KEY = '55f630c614c9ef35570a0ea5e189ade3';
  const city = 'Washington, D.C.';
  const country = 'USA';
  const dataObj = await axios(`https://api.openweathermap.org/data/2.5/weather?q=${city},${country}&appid=${API_KEY}&units=imperial`);
  return dataObj.data;
}

const getPiHoleData = async () => {
  const call = await axios(`http://192.168.1.158/admin/api.php?summary`);
  return call.data;
}

const runScript = (script, args) => {
  var exec = require('child_process').exec;
  exec(`python3 "${__dirname}/scripts/${script}" ${args}`, function (error, stdout, stderr) {
    if (error) {
      console.log('errorororor', error)
    } else {
      console.log('stdout: ' + stdout);
    }
  });
}

// somehow send to client when on
const socketConnect = () => {
  io.sockets.on('connection', function (socket) {
    socket.emit('light', data);
  });
}


// need to "cache" data
// check if data is the same
// could have 3 objs to check

module.exports = {
  read: function () {
    runScript('lights_on.py');
    let index = 0;
    let lcdOptions = ['pihole', 'indoor', 'outdoor'];
    intervalId = setInterval(() => {
      let option = lcdOptions[index++ % lcdOptions.length]
      console.log(option)
      if (option == 'pihole') {
        getPiHoleData()
          .then(res => {
            lcd.clear();
            lcd.text(0, 0, 'Blocked:');
            lcd.text(1, 0, 'Queries:');
            lcd.text(0, 9, res.ads_blocked_today + '     ');
            lcd.text(1, 9, res.dns_queries_today + '     ');
          })
          .catch(err => {
            console.log(err)
            lcd.clear();
            lcd.text(0, 0, 'getPiHoleData');
            lcd.text(1, 0, 'error!');
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
            console.log(err)
            lcd.clear();
            lcd.text(0, 0, 'readIndoorTemp');
            lcd.text(1, 0, 'error!');
          });
      } else if (option == 'outdoor') {
        readOutdoorTemp()
          .then(res => {
            lcd.clear();
            lcd.text(0, 0, res.main.temp + 'F  ');
            lcd.text(1, 0, res.main.humidity + '%  ');
            lcd.text(0, 8, res.weather[0].main);
            lcd.text(1, 8, res.weather[0].description);
          })
          .catch(err => {
            console.log(err)
            lcd.clear();
            lcd.text(0, 0, 'readOutdoorTemp');
            lcd.text(1, 0, 'error!');
          });
      }
    }, 5000);
  },
  lightsOff: function() {
    lcd.clear();
    clearInterval(intervalId);
    intervalId = null;
    runScript('lights_off.py');
  }
};