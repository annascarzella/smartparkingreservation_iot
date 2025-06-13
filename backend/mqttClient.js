//const mqtt = require("mqtt");

import dotenv from "dotenv";
import Gateway from "./models/gateway.js";
import { client } from "./config/mqtt.js";

dotenv.config();

var IDsgateways = [];
// Function to fetch gateways from the database and populate IDsgateways
async function fetchGateways() {
  try {
    const gateways = await Gateway.findAll();
    IDsgateways = gateways.map((gateway) => gateway.id);
    console.log("Gateways fetched:", IDsgateways);
  } catch (error) {
    console.error("Error fetching gateways:", error);
  }
}

async function mqttClient() {
  await fetchGateways();
  client.on("connect", () => {
    console.log("MQTT connected");
    for (const gatewayId of IDsgateways) {
      // Subscribe to the up_link and heartbeat topics for each gateway
      client.subscribe(`${gatewayId}/up_link`, (err) => {
        if (err) {
          console.error(`Failed to subscribe to ${gatewayId}/up_link:`, err);
          return;
        }
        console.log(`Subscribed to ${gatewayId}/up_link`);
      });
      client.subscribe(`${gatewayId}/heartbeat`, (err) => {
        if (err) {
          console.error(`Failed to subscribe to ${gatewayId}/heartbeat:`, err);
          return;
        }
        console.log(`Subscribed to ${gatewayId}/heartbeat`);
      });
    }
  });

  client.on("message", (topic, message) => {
    if (topic.endsWith("/up_link")) {
      const gatewayId = topic.split("/")[0];
      // funzione che mondifica lo stato del lock nel db
      const payload = JSON.parse(message.toString());
      console.log(`Received up_link message on ${topic}:`, payload);
      // Here you can handle the lock status updates
    } else if (topic.endsWith("/heartbeat")) {
      const gatewayId = topic.split("/")[0];
      const payload = JSON.parse(message.toString());
      console.log(`Received heartbeat message on ${topic}:`, payload);
      // Here you can handle the gateway heartbeat updates
    }
  });
}

//module.exports = mqttClient;
export default mqttClient;
