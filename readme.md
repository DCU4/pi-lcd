## LCD Raspberry Pi display

Display indoor and outdoor temperature on a I2C LCD 1602, powered by a Raspberry Pi. Built with Node.js.

Indoor temperature is taken from a DHT-11 Module hooked up to a GPIO on the Pi, which senses both temperature and humidity. Outdoor temp/humidity is taken from https://api.openweathermap.org/.