#!/usr/bin/env python3
import LCD1602

# import args
import sys

def setup():
    LCD1602.init(0x27, 1)   # init(slave address, background light)

if __name__ == "__main__":
    setup()
        