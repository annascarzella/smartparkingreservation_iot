#!/usr/bin/env bash
set -e

# Get the first IP that starts with 192.
IP=$(hostname -I 2>/dev/null | tr ' ' '\n' | grep -m1 '^192\.')

if [ -z "$IP" ]; then
    echo "No IP starting with 192. found"
    exit 1
fi

echo "MQTT_SERVER will be set to: $IP"

sed -i -E "s|#define MQTT_SERVER \".*\"|#define MQTT_SERVER \"$IP\"|g" ./wokwi/wokwi.ino

echo "wokwi.ino updated."
