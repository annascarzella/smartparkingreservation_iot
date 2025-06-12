const mqtt = require('mqtt');
import dotenv from "dotenv";
dotenv.config();
var client = mqtt.connect(process.env.WSMQTT);

var IDsgateways = ["gateway-1", "gateway-2", "gateway-3"];

function mqttClient() {
  client.on('connect', () => {
    console.log('MQTT connected');
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
      }
    );
    }
  });

  client.on('message', (topic, message) => {
    console.log(`[MQTT] ${topic}: ${message.toString()}`);
    // Puoi aggiornare DB qui in base allo status del lock
  });
}

module.exports = mqttClient;
