"use strict";
import { Lock_Status, Lock_Alarm, Lock_MagneticSensor } from "./enum.js";

export default class Lock {
  constructor(
    id,
    latitude,
    longitude,
    batteryLevel,
    status = Lock_Status.FREE,
    alarm = Lock_Alarm.OFF,
    magneticSensor = Lock_MagneticSensor.OFF
  ) {
    this.id = id;
    this.status = status; // reserved, occupied, free, out of order
    this.latitude = latitude;
    this.longitude = longitude;
    this.batteryLevel = batteryLevel; // percentage (0-100)
    this.alarm = alarm; // on, off
    this.magneticSensor = magneticSensor; // on, off
  }

  // Method to update the status of the lock
  updateStatus(newStatus) {
    if (Object.values(Lock_Status).includes(newStatus)) {
      this.status = newStatus;
    } else {
      throw new Error("Invalid status");
    }
  }

  // Method to toggle the alarm
  toggleAlarm() {
    this.alarm = this.alarm === Lock_Alarm.ON ? Lock_Alarm.OFF : Lock_Alarm.ON;
  }

  // Method to toggle the magnetic sensor
  toggleMagneticSensor() {
    this.magneticSensor =
      this.magneticSensor === Lock_MagneticSensor.ON
        ? Lock_MagneticSensor.OFF
        : Lock_MagneticSensor.ON;
  }

  // Method to update battery level
  updateBatteryLevel(level) {
    if (level >= 0 && level <= 100) {
      this.batteryLevel = level;
    } else {
      throw new Error("Battery level must be between 0 and 100");
    }
  }
}
