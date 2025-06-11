import Lock from "./models/lock.js";
import Gateway from "./models/gateway.js";
import {
  Lock_Status,
  Lock_Alarm,
  Lock_MagneticSensor,
  Gateway_Status,
} from "./models/enum.js";

const locks = [
  new Lock("lock-1", 45.4642, 9.19, 87),
  new Lock(
    "lock-2",
    45.4645,
    9.191,
    65,
    Lock_Status.FREE,
    Lock_Alarm.OFF,
    Lock_MagneticSensor.ON
  ),
  new Lock(
    "lock-3",
    45.465,
    9.192,
    40,
    Lock_Status.FREE,
    Lock_Alarm.ON,
    Lock_MagneticSensor.OFF
  ),
  new Lock("lock-4", 45.466, 9.193, 10, Lock_Status.OUT_OF_ORDER),
];

const gateways = [
  new Gateway(
    "gateway-1",
    "Gateway Centrale",
    ["lock-1", "lock-2"],
    45.4642,
    9.19,
    Gateway_Status.CONNECTED
  ),
  new Gateway(
    "gateway-2",
    "Gateway Nord",
    ["lock-3"],
    45.467,
    9.195,
    Gateway_Status.NOT_CONNECTED
  ),
  new Gateway(
    "gateway-3",
    "Gateway Sud",
    ["lock-4"],
    45.463,
    9.188,
    Gateway_Status.UNKNOWN
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
  if (!gateway) return [];
  return gateway.locks.map((lockId) => lockMap.get(lockId)).filter(Boolean);
}
