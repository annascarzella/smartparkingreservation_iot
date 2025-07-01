import mqtt from "mqtt";
import { wsmqttConfig } from "../config/wsmqtt.js";
import Reservation from "../models/reservation.js";
import Lock from "../models/lock.js";
import { LockStatus } from "../models/enums.js";

export async function NotifyArrival(req) {
  const { reservationId } = req.body;

  if (!reservationId) {
    return { status: 400, body: { message: "reservationId is required." } };
  }

  try {
    const reservation = await Reservation.findByPk(reservationId);
    if (!reservation) {
      return { status: 404, body: { message: "Reservation not found." } };
    }

    if (reservation.user_id !== req.userId) {
      return {
        status: 403,
        body: { message: "You are not authorized to notify this reservation." },
      };
    }

    const lock = await Lock.findByPk(reservation.lock_id);
    if (!lock) {
      return { status: 404, body: { message: "Lock not found." } };
    }

    // Notify the MQTT broker about the arrival
    const topic = `${lock.gateway_id}/down_link`;
    const message = JSON.stringify({
      command: "down",
      status: LockStatus.FREE,
      lock_id: lock.id,
    });

    let ack_arrived = false;
    const client = mqtt.connect(wsmqttConfig);
    client.on("connect", () => {
      console.log("Connected to MQTT broker.");
    });
    client.on("error", (err) => {
      console.error("MQTT connection error:", err);
      return { status: 500, body: { message: "MQTT connection error." } };
    });

    return new Promise((resolve) => {
      client.publish(topic, message, (err) => {
        if (err) {
          console.error(`Failed to publish message to ${topic}:`, err);
          client.end();
          resolve({
            status: 500,
            body: { message: "Failed to notify arrival." },
          });
          return;
        }
        console.log(`Published message to ${topic}:`, message);

        client.subscribe(`${lock.gateway_id}/down_link_ack`, (err) => {
          if (err) {
            console.error(
              `Failed to subscribe to ${lock.gateway_id}/down_link_ack:`,
              err
            );
            client.end();
            resolve({
              status: 500,
              body: { message: "Failed to subscribe for updates." },
            });
            return;
          }
          console.log(`Subscribed to ${lock.gateway_id}/down_link_ack`);

          const timeout = setTimeout(() => {
            if (!ack_arrived) {
              client.unsubscribe(`${lock.gateway_id}/down_link_ack`, (err) => {
                if (err) {
                  console.error(
                    `Failed to unsubscribe from ${lock.gateway_id}/down_link_ack after timeout:`,
                    err
                  );
                } else {
                  console.log(
                    `Unsubscribed from ${lock.gateway_id}/down_link_ack after timeout`
                  );
                }
                client.end();
              });
              resolve({
                status: 504,
                body: {
                  message: "No acknowledgment received within 20 seconds.",
                },
              });
            }
          }, 20_000);

          client.on("message", async (topic, message) => {
            if (topic === `${lock.gateway_id}/down_link_ack`) {
              console.log(
                `Received acknowledgment for ${lock.id}:`,
                message.toString()
              );
              ack_arrived = true;
              clearTimeout(timeout);

              try {
                const ackData = JSON.parse(message.toString());
                if (ackData.lockId && ackData.status) {
                  await Lock.update(
                    { status: ackData.status },
                    { where: { id: ackData.lockId } }
                  );
                }
                client.unsubscribe(
                  `${lock.gateway_id}/down_link_ack`,
                  (err) => {
                    if (err) {
                      console.error(
                        `Failed to unsubscribe from ${lock.gateway_id}/down_link_ack:`,
                        err
                      );
                    } else {
                      console.log(
                        `Unsubscribed from ${lock.gateway_id}/down_link_ack`
                      );
                    }
                    client.end();
                  }
                );

                await Reservation.update(
                  { end_time: new Date() },
                  { where: { id: reservation.id } }
                );
                resolve({
                  status: 200,
                  body: { message: "Arrival notification sent." },
                });
              } catch (err) {
                console.error("Failed to update lock status from ack:", err);
                client.end();
                resolve({
                  status: 500,
                  body: { message: "Failed to update lock status from ack." },
                });
              }
            }
          });
        });
      });
    });
  } catch (error) {
    console.error("Error notifying arrival:", error);
    return { status: 500, body: { message: "Internal server error." } };
  }
}

export default {
  NotifyArrival,
};
