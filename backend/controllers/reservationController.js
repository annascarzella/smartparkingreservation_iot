import Reservation from "../models/reservation";
import Lock from "../models/lock.js";
import client from "../config/mqtt.js";
import { LockStatus } from "../models/enums.js";

export async function addReservation(req, res) {
  const { lockId, startTime, endTime, plateNumber } = req.body;

  if (!lockId || !startTime || !endTime || !plateNumber) {
    return res.status(400).json({
      message: "lockId, startTime, endTime, and plateNumber are required.",
    });
  }

  const lock = await Lock.findByPk(lockId);
  if (!lock) {
    return res.status(404).json({ message: "Lock not found." });
  }
  if (lock.status !== LockStatus.FREE) {
    return res.status(400).json({ message: "Lock is not available." });
  }

  // Check if the lock is already reserved during the requested time
  const existingReservation = await Reservation.findOne({
    where: {
      lockId,
      startTime: {
        [Op.lt]: endTime, // Existing reservation starts before the new reservation ends
      },
      endTime: {
        [Op.gt]: startTime, // Existing reservation ends after the new reservation starts
      },
    },
  });
  if (existingReservation) {
    return res.status(400).json({ message: "Lock is already reserved." });
  }

  let ack_arrived = false;
  try {
    client.publish(
      `${lock.gatewayId}/down_link`,
      JSON.stringify({
        command: "up",
        status: LockStatus.RESERVED,
        lockId: lock.id,
        endTime,
      }),
      (err) => {
        if (err) {
          console.error(
            `Failed to publish message to ${lock.gatewayId}/down_link:`,
            err
          );
          return res
            .status(500)
            .json({ message: "Failed to notify reservation." });
        }
        console.log(
          `Published reservation message to ${lock.gatewayId}/down_link`
        );
      }
    );

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
    });

    client.on("message", async (topic, message) => {
      if (topic === `${lock.gatewayId}/down_link_ack`) {
        const payload = JSON.parse(message.toString());
        if (
          payload.lockId === lock.id &&
          payload.status === LockStatus.RESERVED
        ) {
          ack_arrived = true;
          console.log(
            `Received reservation acknowledgment for lock ${lock.id}`
          );
          lock.status = LockStatus.RESERVED;
          lock.save();
          client.unsubscribe(`${lock.gatewayId}/down_link_ack`);
          const newReservation = await Reservation.create({
            user_id: req.userId,
            lockId,
            startTime,
            endTime,
            plateNumber,
          });
          res.status(201).json(newReservation);
        }
      }
    });
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
  } catch (error) {
    console.error("Error creating reservation:", error);
    res.status(500).json({ message: "Internal server error." });
  }
}

export async function extendReservation(req, res) {
  const { reservationId, newEndTime } = req.body;

  if (!reservationId || !newEndTime) {
    return res.status(400).json({
      message: "reservationId and newEndTime are required.",
    });
  }

  const reservation = await Reservation.findByPk(reservationId);
  if (!reservation) {
    return res.status(404).json({ message: "Reservation not found." });
  }

  const lock = await Lock.findByPk(reservation.lockId);
  if (!lock) {
    return res.status(404).json({ message: "Lock not found." });
  }
  if (lock.status !== LockStatus.RESERVED) {
    return res.status(400).json({ message: "Lock is not reserved." });
  }

  // Check if the lock is available for the extended time
  const existingReservation = await Reservation.findOne({
    where: {
      lockId: reservation.lockId,
      startTime: {
        [Op.lt]: newEndTime, // Existing reservation starts before the new reservation ends
      },
      endTime: {
        [Op.gt]: reservation.startTime, // Existing reservation ends after the new reservation starts
      },
    },
  });
  if (existingReservation) {
    return res.status(400).json({ message: "Lock is already reserved." });
  }

  try {
    client.publish(
      `${lock.gatewayId}/down_link`,
      JSON.stringify({
        command: "up",
        status: LockStatus.RESERVED,
        lockId: lock.id,
        endTime: newEndTime,
      }),
      (err) => {
        if (err) {
          console.error(
            `Failed to publish message to ${lock.gatewayId}/down_link:`,
            err
          );
          return res
            .status(500)
            .json({ message: "Failed to notify reservation extension." });
        }
        console.log(
          `Published reservation extension message to ${lock.gatewayId}/down_link`
        );
      }
    );

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
    });
    let ack_arrived = false;
    client.on("message", async (topic, message) => {
      if (topic === `${lock.gatewayId}/down_link_ack`) {
        const payload = JSON.parse(message.toString());
        if (
          payload.lockId === lock.id &&
          payload.status === LockStatus.RESERVED &&
          payload.newEndTime === newEndTime
        ) {
          ack_arrived = true;
          console.log(
            `Received reservation extension acknowledgment for lock ${lock.id}`
          );
          lock.status = LockStatus.RESERVED;
          lock.save();
          client.unsubscribe(`${lock.gatewayId}/down_link_ack`);
          reservation.endTime = newEndTime;
          await reservation.save();
          res.status(200).json(reservation);
        }
      }
    });
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
  } catch (error) {
    console.error("Error extending reservation:", error);
    res.status(500).json({ message: "Internal server error." });
  }
}
