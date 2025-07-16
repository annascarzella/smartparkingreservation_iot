#!/usr/bin/env bash
set -e

# Get the first private IP (starting with 192) — macOS & Linux support
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS: try common interfaces or fall back to parsing ifconfig
    IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1 || ifconfig | grep -Eo 'inet (192\.[0-9]+\.[0-9]+\.[0-9]+)' | awk '{print $2}' | head -n1)
else
    # Linux
    IP=$(hostname -I 2>/dev/null | tr ' ' '\n' | grep -m1 '^192\.')
fi

echo "MQTT_SERVER will be set to: $IP"

sed -i -E "s|#define MQTT_SERVER \".*\"|#define MQTT_SERVER \"$IP\"|g" ./wokwi/wokwi.ino

echo "wokwi.ino updated."
