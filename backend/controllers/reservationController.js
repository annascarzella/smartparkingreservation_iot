import Reservation from "../models/reservation.js";
import Lock from "../models/lock.js";
import mqtt from "mqtt";
import { Op } from "sequelize";
import { wsmqttConfig } from "../config/wsmqtt.js";
import { LockStatus } from "../models/enums.js";

export async function addReservation(req) {
  const { lockId, startTime, endTime, plateNumber } = req.body;

  if (!lockId || !startTime || !endTime || !plateNumber) {
    return {
      status: 400,
      body: {
        message: "lockId, startTime, endTime, and plateNumber are required.",
      },
    };
  }

  const start_time = startTime;
  const end_time = endTime;

  const lock = await Lock.findByPk(lockId);
  if (!lock) {
    return { status: 404, body: { message: "Lock not found." } };
  }
  if (lock.status !== LockStatus.FREE) {
    return { status: 400, body: { message: "Lock is not available." } };
  }

  const existingReservation = await Reservation.findOne({
    where: {
      lock_id: lockId,
      end_time: {
        [Op.gt]: startTime,
      },
    },
  });
  if (existingReservation) {
    return { status: 400, body: { message: "Lock is already reserved." } };
  }

  if (
    new Date(endTime).getTime() - new Date(startTime).getTime() >
    3 * 60 * 60 * 1000
  ) {
    return {
      status: 400,
      body: { message: "Reservation cannot be longer than 3 hours." },
    };
  }

  const now = Date.now();
  const alreadyhavereservation = await Reservation.findOne({
    where: {
      user_id: req.userId,
      end_time: {
        [Op.gt]: now,
      },
    },
  });
  if (alreadyhavereservation) {
    return {
      status: 400,
      body: { message: "You already have an active reservation." },
    };
  }

  let ack_arrived = false;
  const client = mqtt.connect(wsmqttConfig);
  client.on("connect", () => {
    console.log("Connected to MQTT broker.");
  });
  client.on("error", (err) => {
    console.error("MQTT connection error:", err);
    return { status: 500, body: { message: "MQTT connection error." } };
  });

  try {
    client.publish(
      `${lock.gateway_id}/down_link`,
      JSON.stringify({
        command: "up",
        status: LockStatus.RESERVED,
        lock_id: lock.id,
        endTime,
      }),
      (err) => {
        if (err) {
          console.error(
            `Failed to publish message to ${lock.gateway_id}/down_link:`,
            err
          );
          client.end();
          return {
            status: 500,
            body: { message: "Failed to notify reservation." },
          };
        }
        console.log(
          `Published reservation message to ${lock.gateway_id}/down_link`
        );
      }
    );

    client.subscribe(`${lock.gateway_id}/down_link_ack`, (err) => {
      if (err) {
        console.error(
          `Failed to subscribe to ${lock.gateway_id}/down_link_ack:`,
          err
        );
        client.end();
        return {
          status: 500,
          body: { message: "Failed to subscribe for updates." },
        };
      }
      console.log(`Subscribed to ${lock.gateway_id}/down_link_ack`);
    });

    // Wait for MQTT acknowledgment or timeout (10 seconds)
    await new Promise((resolve, reject) => {
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
          reject({
            status: 504,
            body: { message: "No acknowledgment received within 20 seconds." },
          });
        }
      }, 10_000);

      client.on("message", async (topic, message) => {
        if (topic === `${lock.gateway_id}/down_link_ack`) {
          const payload = JSON.parse(message.toString());
          if (payload.lockId === lock.id) {
            ack_arrived = true;
            clearTimeout(timeout);
            console.log(
              `Received reservation acknowledgment for lock ${lock.id}`
            );
            lock.status = LockStatus.RESERVED;
            await lock.save();
            client.unsubscribe(`${lock.gateway_id}/down_link_ack`);
            client.end();
            const newReservation = await Reservation.create({
              user_id: req.userId,
              lock_id: lockId,
              start_time,
              end_time,
              plate_number: plateNumber,
            });
            resolve({
              status: 201,
              data: newReservation,
            });
          }
        }
      });
    }).catch((result) => {
      throw result;
    });
  } catch (error) {
    console.error("Error creating reservation:", error);
    return { status: 500, body: { message: "Internal server error." } };
  }
}

export async function extendReservation(req) {
  const { reservationId, newEndTime } = req.body;

  if (!reservationId || !newEndTime) {
    return {
      status: 400,
      body: { message: "reservationId and newEndTime are required." },
    };
  }

  const reservation = await Reservation.findByPk(reservationId);
  if (!reservation) {
    return { status: 404, body: { message: "Reservation not found." } };
  }

  const lock = await Lock.findByPk(reservation.lock_id);
  if (!lock) {
    return { status: 404, body: { message: "Lock not found." } };
  }
  if (lock.status !== LockStatus.RESERVED) {
    return { status: 400, body: { message: "Lock is not reserved." } };
  }

  const now = Date.now();

  const activeReservation = await Reservation.findOne({
    where: {
      id: reservation.id,
      end_time: {
        [Op.gt]: now,
      },
    },
  });
  if (!activeReservation) {
    return { status: 400, body: { message: "No active reservation found." } };
  }

  if (new Date(newEndTime).getTime() <= now) {
    return {
      status: 400,
      body: { message: "New end time must be in the future." },
    };
  }
  if (new Date(newEndTime).getTime() <= reservation.end_time.getTime()) {
    return {
      status: 400,
      body: {
        message: "New end time must be later than the current end time.",
      },
    };
  }

  if (
    new Date(newEndTime).getTime() - reservation.start_time.getTime() >
    3 * 60 * 60 * 1000
  ) {
    return {
      status: 400,
      body: { message: "Reservation cannot be extended beyond 3 hours." },
    };
  }

  const client = mqtt.connect(wsmqttConfig);
  client.on("connect", () => {
    console.log("Connected to MQTT broker.");
  });
  client.on("error", (err) => {
    console.error("MQTT connection error:", err);
    return { status: 500, body: { message: "MQTT connection error." } };
  });

  try {
    client.publish(
      `${lock.gateway_id}/down_link`,
      JSON.stringify({
        command: "up",
        status: LockStatus.RESERVED,
        lock_id: lock.id,
        endTime: newEndTime,
      }),
      (err) => {
        if (err) {
          console.error(
            `Failed to publish message to ${lock.gateway_id}/down_link:`,
            err
          );
          client.end();
          return {
            status: 500,
            body: { message: "Failed to notify reservation extension." },
          };
        }
        console.log(
          `Published reservation extension message to ${lock.gateway_id}/down_link`
        );
      }
    );

    client.subscribe(`${lock.gateway_id}/down_link_ack`, (err) => {
      if (err) {
        console.error(
          `Failed to subscribe to ${lock.gateway_id}/down_link_ack:`,
          err
        );
        client.end();
        return {
          status: 500,
          body: { message: "Failed to subscribe for updates." },
        };
      }
      console.log(`Subscribed to ${lock.gateway_id}/down_link_ack`);
    });
    let ack_arrived = false;

    // Wait for MQTT acknowledgment or timeout (10 seconds)
    await new Promise((resolve, reject) => {
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
          reject({
            status: 504,
            body: { message: "No acknowledgment received within 10 seconds." },
          });
        }
      }, 10_000);

      client.on("message", async (topic, message) => {
        if (topic === `${lock.gateway_id}/down_link_ack`) {
          const payload = JSON.parse(message.toString());
          if (
            payload.lockId === lock.id &&
            payload.status === LockStatus.RESERVED
          ) {
            ack_arrived = true;
            clearTimeout(timeout);
            console.log(
              `Received reservation extension acknowledgment for lock ${lock.id}`
            );
            lock.status = LockStatus.RESERVED;
            await lock.save();
            client.unsubscribe(`${lock.gateway_id}/down_link_ack`);
            client.end();
            reservation.end_time = newEndTime;
            await reservation.save();
            resolve({ status: 200, data: reservation });
          }
        }
      });
    }).catch((result) => {
      throw result;
    });
  } catch (error) {
    console.error("Error extending reservation:", error);
    return { status: 500, body: { message: "Internal server error." } };
  }
}

export async function getCurrentReservation(req) {
  const now = Date.now();
  const reservation = await Reservation.findOne({
    where: {
      user_id: req.userId,
      end_time: {
        [Op.gt]: now,
      },
    },
  });

  if (!reservation) {
    return { status: 404, body: { message: "No active reservation found." } };
  }

  return { status: 200, data: reservation };
}

export default {
  addReservation,
  extendReservation,
  getCurrentReservation,
};
