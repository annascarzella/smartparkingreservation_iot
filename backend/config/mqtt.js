import mqtt from "mqtt";
import { wsmqttConfig } from "./wsmqtt.js";

export const client = mqtt.connect(wsmqttConfig);
