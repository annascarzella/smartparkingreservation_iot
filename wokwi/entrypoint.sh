#!/bin/sh

# Wait until file is available
for i in $(seq 1 5); do
  if [ -f /wokwi/wokwi.ino ]; then
    break
  fi
  echo "Waiting for wokwi.ino to be ready..."
  sleep 1
done

echo "Compiling sketch..."
arduino-cli compile --fqbn esp32:esp32:esp32 --output-dir /wokwi/build /wokwi/wokwi.ino

echo "Compile finished."