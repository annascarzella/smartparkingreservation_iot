import e from "express";
import Gateway from "../models/gateway.js";
import Lock from "../models/lock.js";

export async function fetchAll(req, res) {
  try {
    const gateways = await Gateway.findAll();
    const locks = await Lock.findAll();
    res.status(200).json({
      gateways,
      locks,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Internal server error." });
  }
}

export async function fetchByIdGateway(req, res) {
  const { id } = req.params;
  try {
    const gateway = await Gateway.findByPk(id);
    if (!gateway) {
      return res.status(404).json({ message: "Not found" });
    }
    res.status(200).json(gateway);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Internal server error." });
  }
}

export async function fetchByIdLock(req, res) {
  const { id } = req.params;
  try {
    const lock = await Lock.findByPk(id);
    if (!lock) {
      return res.status(404).json({ message: "Not found" });
    }
    res.status(200).json(lock);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Internal server error." });
  }
}

export default {
  fetchAll,
  fetchByIdGateway,
  fetchByIdLock,
};