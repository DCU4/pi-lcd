const express = require('express');
const app = express();
const http = require('http').createServer(app);
const https = require('https')
const fs = require('fs')
const io = require('socket.io')(http);
const cors = require('cors');
const readPi = require('./readPi');
const repeats = 10;
const logger = require('morgan');
const logFile = fs.createWriteStream(__dirname + '/node.log', {flags: 'a'}); //use {flags: 'w'} to open in write mode
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(logger('combined', {stream: logFile}));
// app.use(express.static(__dirname + '/views')); // html
app.use(express.static(__dirname + '/public')); // js, css, images

runScript('lights_off.py');

// routes
app.get('/', (req, res) => {
  if (res.statusCode === 200) {
    console.log(req.ip);
    res.sendFile('/views/index.html', {
      root: __dirname
    });
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
      socket.emit('light', data);
      readPi.read();
    } else {
      socket.emit('light', data);
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

function runScript(script, args = '') {
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
