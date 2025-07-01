import Gateway from "./models/gateway.js";
import Lock from "./models/lock.js";
import { LockStatus } from "./models/enums.js";
import mqtt from "mqtt";
import { wsmqttConfig } from "./config/wsmqtt.js";
import Reservation from "./models/reservation.js";
import { Op } from "sequelize";

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
  const client = mqtt.connect(wsmqttConfig);
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

  client.on("message", async (topic, message) => {
    if (topic.endsWith("/up_link")) {
      const gatewayId = topic.split("/")[0];
      // funzione che mondifica lo stato del lock nel db
      const payload = JSON.parse(message.toString());
      const lock = await Lock.findOne({ where: { id: payload.lockId } });
      if (lock) {
        lock.status = payload.status; // Update the lock status
        await lock.save(); // Save the updated lock status to the database
      } else {
        console.error(`Lock with ID ${payload.lockId} not found.`);
      }
      console.log(`Received up_link message on ${topic}:`, payload);
    } else if (topic.endsWith("/heartbeat")) {
      const gatewayId = topic.split("/")[0];
      const payload = JSON.parse(message.toString());
      console.log(`Received heartbeat message on ${topic}:`, payload);
      const gateway = await Gateway.findOne({ where: { id: gatewayId } });
      if (gateway) {
        gateway.status = payload.status; // Update the gateway status
        await gateway.save(); // Save the updated gateway status to the database
      } else {
        console.error(`Gateway with ID ${gatewayId} not found.`);
      }
      if (Array.isArray(payload.locks)) {
        payload.locks.forEach(async (lockData) => {
          try {
            const lock = await Lock.findOne({ where: { id: lockData.id } });
            if (lock) {
              lock.hearthbeatReceived = true; // Update heartbeat received status
              await lock.save();
              console.log(`Lock ${lock.id} heartbeat received.`);
              console.log(`Lock status:`, lock.status);
              console.log(`Lock data:`, lockData);
              console.log(`Reserved:`, LockStatus.RESERVED);
              if (lock.status == LockStatus.OUT_OF_ORDER) {
                if (lockData.status == LockStatus.RESERVED) {
                  client.publish(
                    `${gatewayId}/down_link`,
                    JSON.stringify({
                      command: "down",
                      status: LockStatus.FREE,
                      lock_id: lock.id,
                      endTime: 0,
                    })
                  );

                  client.subscribe(`${gatewayId}/down_link_ack`, (err) => {
                    if (err) {
                      console.error(
                        `Failed to subscribe to ${gatewayId}/down_link_ack:`,
                        err
                      );
                    } else {
                      console.log(`Subscribed to ${gatewayId}/down_link_ack`);
                    }
                  });
                  
                  const timeout = setTimeout(() => {
                    client.unsubscribe(`${gatewayId}/down_link_ack`, (err) => {
                      if (err) {
                        console.error(
                          `Failed to unsubscribe from ${gatewayId}/down_link_ack after timeout:`,
                          err
                        );
                      } else {
                        console.log(
                          `Unsubscribed from ${gatewayId}/down_link_ack after timeout`
                        );
                      }
                    });
                  }, 10_000);
                  
                  client.on("message", async (topic, message) => {
                    if (topic === `${gatewayId}/down_link_ack`) {
                      clearTimeout(timeout); // Clear the timeout if we receive an acknowledgment
                      client.unsubscribe(
                        `${gatewayId}/down_link_ack`,
                        (err) => {
                          if (err) {
                            console.error(
                              `Failed to unsubscribe from ${gatewayId}/down_link_ack:`,
                              err
                            );
                          } else {
                            console.log(
                              `Unsubscribed from ${gatewayId}/down_link_ack`
                            );
                          }
                        }
                      );
                      console.log(
                        `Received acknowledgment for ${lock.id}:`,
                        message.toString()
                      );
                      lock.status = LockStatus.FREE; // era up dobbiamo metterlo down
                      await lock.save();
                    }
                  });
                }
              } else if (lockData.status == LockStatus.RESERVED) {
                console.log(`Lock ${lock.id} is reserved, checking for active reservation...`);
                const now = Date.now();
                const reservationActive = await Reservation.findOne({
                  where: {
                    lockId: lock.id,
                    end_time: {
                      [Op.gt]: now,
                    },
                  }
                });
                if (!reservationActive) {
                  console.log(`Lock ${lock.id} is reserved but no active reservation found.`);
                  const topic = `${lock.gateway_id}/down_link`;
                      const message = JSON.stringify({
                        command: "down",
                        status: LockStatus.FREE,
                        lock_id: lock.id,
                      });
                  client.publish(topic, message, (err) => {
                    if (err) {
                      console.error(`Failed to publish message to ${topic}:`, err);
                    } else {
                      console.log(`Message published to ${topic}`);
                    }
                  });
                }
              } else{
                lock.status = lockData.status;
              }
              await lock.save();
            } else {
              console.error(`Lock with ID ${lockData.id} not found.`);
            }
          } catch (err) {
            console.error(`Error updating lock ${lockData.id}:`, err);
          }
        });
      }
    }
  });

  setInterval(() => {
    //check if every lock has sent a heartbeat in the last 120 seconds
    Lock.findAll().then((locks) => {
      locks.forEach(async (lock) => {
        const lastHeartbeat = lock.hearthbeatReceived;
        if (!lastHeartbeat && lock.status != LockStatus.OUT_OF_ORDER) {
          console.warn(
            `Lock ${lock.id} has not received a heartbeat in the last 120 seconds.`
          );
          lock.status = LockStatus.OUT_OF_ORDER; // Set status to OUT_OF_ORDER
          await lock.save();
        }
        lock.hearthbeatReceived = false; // Reset heartbeat received status
      });
    });
  }, 120_000);
}

export default mqttClient;
