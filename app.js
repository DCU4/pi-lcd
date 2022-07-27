const express = require('express');
const app = express();
const http = require('http').createServer(app);
const https = require('https')
const io = require('socket.io')(http);
const cors = require('cors')
const axios = require('axios')
const LCD = require('@oawu/lcd1602');
const sensorTemp = require("node-dht-sensor").promises;
let count = 0;
const repeats = 10;
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
// app.use(express.static(__dirname + '/views')); // html
app.use(express.static(__dirname + '/public')); // js, css, images


// routes
app.get('/', (req, res) => {
  if (res.statusCode === 200) {
    res.sendFile('/views/index.html', {
      root: __dirname
    });
  } else {
    return res.status(404);
  }
});



let tempShowing = true;
app.get('/lcd', (req, res) => {
  if (res.statusCode === 200) {


    setInterval(function () {
      const lcd = new LCD();
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


    res.send('on');

  } else {
    return res.status(404);
  }

});


// websocket
io.sockets.on('connection', function (socket) {

  // light input
  socket.on('light', (data) => {
    console.log('data onlight', data)
    lightvalue = (data);
    if (data) {
      turnOn()
      socket.emit('light', data);
    } else {
      turnOff()
      socket.emit('light', data);
    }
  });

  emitScript(socket, 'sexy-time', 'rainbow.py', 'sexy-time');

});


// functions
const readIndoorTemp = async () => {
  sensorTemp.initialize(11, 25);
  const dataObj = await sensorTemp.read(11, 25)
  const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
  const dayOptions = { weekday: 'long' };
  const date = new Date().toLocaleDateString('en-US', options);
  const day = new Date().toLocaleDateString('en-US', dayOptions);
  dataObj.day = day;
  dataObj.date = date;
  dataObj.temp = `${(dataObj.temperature.toFixed(1) * 9 / 5) + 32}F`;
  dataObj.hum = `${dataObj.humidity.toFixed(1)}%`;
  count++;
  return dataObj
}

const readOutdoorTemp = async () => {
  const API_KEY = secret;
  const city = 'Washington, D.C.';
  const country = 'USA';
  const dataObj = await axios(`https://api.openweathermap.org/data/2.5/weather?q=${city},${country}&appid=${API_KEY}&units=imperial`);
  return dataObj.data;
}


const getPiHoleData = async () => {
  const call = await axios(`http://192.168.1.158/admin/api.php?summaryRaw`);
  const data = await call.json();
  console.log({ call, data });
}


function emitScript(socket, msg, script, args) {
  socket.on(msg, (data) => {
    console.log(data);
    if (data) {
      runScript(script, args);
    } else {
      runScript('turn_off.py');
    }
    socket.emit(msg, data);
    socket.emit('light', data);
  });
}

function runScript(script, args) {
  var exec = require('child_process').exec;
  exec(`python3 "${__dirname}/scripts/${script}" ${args}`, function (error, stdout, stderr) {
    if (error) {
      console.log('errorororor', error)
    } else {
      console.log('stdout: ' + stdout);
    }
  });
}


function turnOn(r = 255, g = 255, b = 255) {
  var exec = require('child_process').exec;
  exec(`python "${__dirname}/scripts/turn_on.py" ${r} ${g} ${b}`, function (error, stdout, stderr) {
    if (error) {
      console.log('errorororor', error);
    } else {
      console.log('stdout: ' + stdout);
    }
  });

}



http.listen(3001, () => {
  console.log('connected to serverrrr');
});

process.on('SIGINT', function () { //on ctrl+c
  process.exit()
});
