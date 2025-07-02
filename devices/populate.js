"use strict";
import Lock from "./models/lock.js";
import Gateway from "./models/gateway.js";
import {
  Lock_Status,
  Lock_Alarm,
  Lock_MagneticSensor,
  Gateway_Status,
} from "./models/enum.js";

const locks = [
  new Lock(
    3,
    45.465,
    9.192,
    40
  ),
  new Lock(4, 45.466, 9.193, 10),
];

const gateways = [
  new Gateway(
    2,
    "Gateway 2",
    [locks[0]],
    45.467,
    9.195,
    Gateway_Status.CONNECTED
  ),
  new Gateway(
    3,
    "Gateway 3",
    [locks[1]],
    45.463,
    9.188,
    Gateway_Status.CONNECTED
  ),
];

const lockMap = new Map(locks.map((lock) => [lock.id, lock]));
const gatewayMap = new Map(gateways.map((gw) => [gw.id, gw]));

export async function getAllLocks() {
  return [...lockMap.values()];
}

export async function getLockById(id) {
  return lockMap.get(id) || null;
}

export async function getAllGateways() {
  return [...gatewayMap.values()];
}

export async function getGatewayById(id) {
  return gatewayMap.get(id) || null;
}

export async function getLocksByGatewayId(gatewayId) {
  const gateway = gatewayMap.get(gatewayId);
  if (!gateway) {
    return [];
  }
  return gateway.locks.map((lock) => lockMap.get(lock.id)).filter(Boolean);
}
