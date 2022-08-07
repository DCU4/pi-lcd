const express = require('express');
const app = express();
const http = require('http').createServer(app);
const https = require('https')
const io = require('socket.io')(http);
const cors = require('cors')
const axios = require('axios')
const LCD = require('@oawu/lcd1602');
const sensorTemp = require("node-dht-sensor").promises;
const readPi = require('./readPi');
let intervalId;
const repeats = 10;
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
// app.use(express.static(__dirname + '/views')); // html
app.use(express.static(__dirname + '/public')); // js, css, images


// routes
app.get('/', (req, res) => {
  if (res.statusCode === 200) {
    // readPi.read();
    res.sendFile('/views/index.html', {
      root: __dirname
    });
  } else {
    return res.status(404);
  }
});


// need to "cache" data
// check if data is the same
// could have 3 objs to check

app.get('/lcd', (req, res) => {
  if (res.statusCode === 200) {
    readPi.read();
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
    if (data) {
      socket.emit('light on', data);
      readPi.read();
    } else {
      socket.emit('light off', data);
      readPi.lightsOff();
    }
  });
});


// functions

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



http.listen(3001, () => {
  console.log('connected to serverrrr');
});

process.on('SIGINT', function () { //on ctrl+c
  readPi.lightsOff();
  process.exit();
});
