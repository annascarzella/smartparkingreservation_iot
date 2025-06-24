"use strict";
import { getAllLocks, getAllGateways } from "./populate.js";

const locks = await getAllLocks();
const gateways = await getAllGateways();

for (const gateway of gateways) {
  gateway.connect();
}
