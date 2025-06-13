import { client } from "../config/mqtt.js";
import Reservation from "../models/reservation.js";
import Lock from "../models/lock.js";
import { LockStatus } from "../models/enums.js";

export async function NotifyArrival(req, res) {
  const { reservationId } = req.body;

  if (!reservationId) {
    return res.status(400).json({ message: "reservationId is required." });
  }

  try {
    const reservation = await Reservation.findByPk(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found." });
    }

    if (reservation.user_id !== req.userId) {
      return res
        .status(403)
        .json({
          message: "You are not authorized to notify this reservation.",
        });
    }

    const lock = await Lock.findOne({ where: { id: reservation.lockId } });
    if (!lock) {
      return res.status(404).json({ message: "Lock not found." });
    }

    // Notify the MQTT broker about the arrival
    const topic = `${lock.gatewayId}/down_link`;
    const message = JSON.stringify({
      command: "down",
      status: LockStatus.FREE,
      lockId: lock.id,
    });

    let ack_arrived = false;

    client.publish(topic, message, (err) => {
      if (err) {
        console.error(`Failed to publish message to ${topic}:`, err);
        return res.status(500).json({ message: "Failed to notify arrival." });
      }
      console.log(`Published message to ${topic}:`, message);

      client.subscribe(`${lock.gatewayId}/down_link_ack`, (err) => {
        if (err) {
          console.error(
            `Failed to subscribe to ${lock.gatewayId}/down_link_ack:`,
            err
          );
          return res
            .status(500)
            .json({ message: "Failed to subscribe for updates." });
        }
        console.log(`Subscribed to ${lock.gatewayId}/down_link_ack`);
        setTimeout(() => {
          if (!ack_arrived) {
            client.unsubscribe(`${lock.gatewayId}/down_link_ack`, (err) => {
              if (err) {
                console.error(
                  `Failed to unsubscribe from ${lock.gatewayId}/down_link_ack after timeout:`,
                  err
                );
              } else {
                console.log(
                  `Unsubscribed from ${lock.gatewayId}/down_link_ack after timeout`
                );
              }
            });
            return res.status(504).json({
              message: "No acknowledgment received within 20 seconds.",
            });
          }
        }, 20_000);
      });

      client.on("message", async (topic, message) => {
        if (topic === `${lock.gatewayId}/down_link_ack`) {
          console.log(
            `Received acknowledgment for ${lock.id}:`,
            message.toString()
          );
          ack_arrived = true;

          try {
            const ackData = JSON.parse(message.toString());
            if (ackData.lockId && ackData.status) {
              await Lock.update(
                { status: ackData.status },
                { where: { id: ackData.lockId } }
              );
            }
            client.unsubscribe(`${lock.gatewayId}/down_link_ack`, (err) => {
              if (err) {
                console.error(
                  `Failed to unsubscribe from ${lock.gatewayId}/down_link_ack:`,
                  err
                );
              } else {
                console.log(
                  `Unsubscribed from ${lock.gatewayId}/down_link_ack`
                );
              }
            });

            res.status(200).json({ message: "Arrival notification sent." });
          } catch (err) {
            console.error("Failed to update lock status from ack:", err);
          }
        }
      });
    });
  } catch (error) {
    console.error("Error notifying arrival:", error);
    res.status(500).json({ message: "Internal server error." });
  }
}
