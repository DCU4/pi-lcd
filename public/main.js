const url = '192.168.1.158:3001';
const lightSwitch = document.getElementById("lcd-light");
const socket = io().connect(`ws://${url}`, {reconnect: true, transports : ['websocket'], path: '/socket.io'});
const emitMessage = (el, msg) => {
  const emitter = document.getElementById(el);
  emitter.addEventListener("change", function() {
    socket.emit(msg, Number(this.checked)); 
  });
}

window.addEventListener("load", function() { //when page loads
    const lightSwitch = document.getElementById("lcd-light");

    lightSwitch.addEventListener("change", function() { //add event listener for when checkbox changes
      socket.emit("light", Number(this.checked)); //send button status to server (as 1 or 0)
    });

    // emitMessage('yeooo', 'yeooo')
    
});



socket.on('light', function(data) { //get button status from client
  if (data == 1){
    lightSwitch.checked = true;
  } else {
    lightSwitch.checked = false;
  }
});
