FROM jpconstantineau/arduino-cli:0.34.2

# Verify installation
RUN arduino-cli version

# install ESP32 Board Platform
RUN arduino-cli core update-index 
RUN arduino-cli core install esp32:esp32

RUN arduino-cli lib update-index

# install required libraries
# todo take libraries.txt to install libraries
RUN arduino-cli lib install "PubSubClient" "ArduinoJson" "ESP32Servo" "NTPClient" "HCSR04 ultrasonic MKL"

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT [ "entrypoint.sh" ]

