"use strict";
import { getAllLocks, getAllGateways, getGatewayById } from "./populate.js";
import { Lock_Status, Gateway_Status } from "./models/enum.js";
import mqtt from "mqtt";
var client = mqtt.connect("ws://mqtt:8000");

const locks = await getAllLocks();
const gateways = await getAllGateways();

client.on("connect", function () {
  console.log("Connected");

  for (const gateway of gateways) {
    // Subscribe to the down_link topic for each gateway
    client.subscribe(`${gateway.id}/down_link`, function (err) {
      if (err) {
        console.error(`Failed to subscribe to ${gateway.id}/down_link:`, err);
        return;
      }
      console.log(`Subscribed to ${gateway.id}/down_link`);
    });
  }

  // sometimes update the status of locks randomly
  setInterval(function () {
    const lock = locks[Math.floor(Math.random() * locks.length)];
    const lockstatuses = Object.values(Lock_Status);
    if (lock) {
      const newStatus =
        lockstatuses[Math.floor(Math.random() * lockstatuses.length)];
      lock.updateStatus(newStatus);

      const gateway = gateways.find((g) => g.locks.includes(lock.id));
      if (gateway) {
        const payload = JSON.stringify({
          lockId: lock.id,
          status: lock.status,
          timestamp: new Date().toISOString(),
        });
        console.log(
          `Publishing random status update for lock ${lock.id} on gateway ${gateway.id}`
        );
        client.publish(`${gateway.id}/up_link`, payload);
      }
    }
  }, 30_000);

  // Publish heartbeat messages for each gateway every 5 seconds
  setInterval(function () {
    for (const gateway of gateways) {
      const Json = JSON.stringify({
        status: gateway.status,
        locks: gateway.locks.map((lockId) => {
          const lock = locks.find((l) => l.id === lockId);
          return lock
            ? { id: lock.id, status: lock.status }
            : { id: lockId, error: "Lock not found" };
        }),
        timestamp: new Date().toISOString(),
      });
      console.log(`Publishing heartbeat for gateway ${gateway.id}`);
      client.publish(`${gateway.id}/heartbeat`, Json);
    }
  }, 60_000);
});

// on mqtt message received of topic down_link
client.on("message", function (topic, message) {
  if ("down_link" in topic) {
    const gatewayId = topic.split("/")[0];
    console.log(`Received down_link message for gateway ${gatewayId}`);
    const gateway = getGatewayById(gatewayId);
    if (!gateway) {
      console.error(`Gateway ${gatewayId} not found`);
      return;
    }
    message = JSON.parse(message.toString());
    if (message.command === "up" || message.command === "down") {
      const lock = locks.find((l) => l.id === message.lockId);
      if (lock) {
        lock.updateStatus(
          message.command === "up" ? Lock_Status.OCCUPIED : Lock_Status.FREE
        );
        console.log(`Lock ${lock.id} status updated to ${message.status}`);

        // Publish the acknowledgment back to the gateway
        client.publish(
          `${gatewayId}/down_link_ack`,
          JSON.stringify({
            lockId: lock.id,
            status: lock.status,
            timestamp: new Date().toISOString(),
          })
        );
      } else {
        console.error(`Lock ${message.lockId} not found`);
      }
    } else {
      console.error(`Unknown command: ${message.command}`);
    }
  }
});
