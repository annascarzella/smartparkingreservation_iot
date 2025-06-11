import { Gateway_Status } from "./enum.js";

export default class Gateway {
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
    this.locks = locks; // Array of lock IDs
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
}
