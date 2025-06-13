import mqtt from "mqtt";
import WSMQTT from "./wsmqtt.js";

export const client = mqtt.connect(WSMQTT);
