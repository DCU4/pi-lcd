#!/usr/bin/env python3
import LCD1602
import time

# import args
import sys

def setup():
    LCD1602.init(0x27, 1)   # init(slave address, background light)
    print(sys.argv)
    LCD1602.write(0, 0, sys.argv[1])
    LCD1602.write(1, 1, 'From SunFounder')
    time.sleep(2)

def lights_off():
    LCD1602.closelight()

if __name__ == "__main__":
    lights_off()
        