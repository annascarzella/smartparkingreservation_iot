"use strict";
import { Gateway_Status, Lock_Status } from "./enum.js";
import dotenv from "dotenv";
import mqtt from "mqtt";

dotenv.config();
export default class Gateway {
  client = null;
  lockReservations = {};
  lockArrivals = {};

  constructor(
    id,
    name,
    locks = [],
    latitudide,
    longitudide,
    status = Gateway_Status.UNKNOWN
  ) {
    this.id = id;
    this.name = name;
    this.locks = locks; // Array of lock
    this.latitudide = latitudide;
    this.longitudide = longitudide;
    this.status = status;
  }

  updateStatus(newStatus) {
    if (Object.values(Gateway_Status).includes(newStatus)) {
      this.status = newStatus;
    } else {
      throw new Error("Invalid status");
    }
  }

  connect() {
    this.client = mqtt.connect(process.env.WSMQTT);

    this.client.on("connect", () => {
      console.log("Connected");
      this.updateStatus(Gateway_Status.CONNECTED);

      this.client.subscribe(`${this.id}/down_link`, (err) => {
        if (err) {
          console.error(`Failed to subscribe to ${this.id}/down_link:`, err);
          return;
        }
        console.log(`Subscribed to ${this.id}/down_link`);
      });

      // Publish heartbeat messages for each gateway every 5 seconds
      setInterval(() => {
        const Json = JSON.stringify({
          status: this.status,
          locks: this.locks.map((lock) => {
            return { id: lock.id, status: lock.status };
          }),
        });
        console.log(`Publishing heartbeat for gateway ${this.id}`);
        this.client.publish(`${this.id}/heartbeat`, Json);
      }, 60_000);
    });

    /////////////////
    this.client.on("message", (topic, message) => {
      if (topic.endsWith("/down_link")) {
        const gatewayId = topic.split("/")[0];
        if (gatewayId != this.id) {
          console.error(`Received message for unknown gateway ${gatewayId}`);
          return;
        }
        console.log(`Received down_link message for gateway ${gatewayId}`);

        message = JSON.parse(message.toString());
        if (message.command === "up" || message.command === "down") {
          const lock = this.locks.find((l) => l.id === message.lock_id);
          if (lock) {
            lock.updateStatus(
              message.command === "up" ? Lock_Status.RESERVED : Lock_Status.FREE
            );
            console.log(`Lock ${lock.id} status updated to ${message.status}`);

            // Publish the acknowledgment back to the gateway
            this.client.publish(
              `${this.id}/down_link_ack`,
              JSON.stringify({
                lockId: lock.id,
                status: lock.status,
                timestamp: new Date().toISOString(),
              })
            );

            if (message.endTime == null) {
              return;
            }

            if (message.command === "down") {
              // Add true to lockArrivals to indicate the lock has arrived
              this.lockArrivals[lock.id] = true;
            } else {
              this.lockArrivals[lock.id] = false;
            }

            const msUntilEnd = new Date(message.endTime).getTime() - Date.now();
            if (msUntilEnd > 0) {
              const int = setTimeout(() => {
                console.log(
                  `Lock ${
                    lock.id
                  } reservation ended at ${new Date().toISOString()}`
                );
                if (!this.lockArrivals[lock.id]) {
                  lock.updateStatus(Lock_Status.FREE);
                  console.log(
                    `Lock ${lock.id} status automatically set to FREE after endtime`
                  );
                  this.client.publish(
                    `${this.id}/up_link`,
                    JSON.stringify({
                      lockId: lock.id,
                      status: lock.status,
                      timestamp: new Date().toISOString(),
                    })
                  );
                }
              }, msUntilEnd);
              // Store the interval in the lockReservations dictionary
              if (!this.lockReservations[lock.id]) {
                this.lockReservations[lock.id] = int;
              } else {
                // Clear the previous interval if it exists
                clearTimeout(this.lockReservations[lock.id]);
                this.lockReservations[lock.id] = int;
              }
            }
          } else {
            console.error(`Lock ${message.lock_id} not found`);
          }
        } else {
          console.error(`Unknown command: ${message.command}`);
        }
      }
    });
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      this.client = null;
      this.updateStatus(Gateway_Status.NOT_CONNECTED);
    }
  }
}
