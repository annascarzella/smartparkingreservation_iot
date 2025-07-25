import Gateway from "../models/gateway.js";
import Lock from "../models/lock.js";

export async function fetchAll(req) {
  try {
    const gateways = await Gateway.findAll();
    const locks = await Lock.findAll();
    return {
      status: 200,
      body: {
        gateways,
        locks,
      },
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    return { status: 500, body: { message: "Internal server error." } };
  }
}

export async function fetchByIdGateway(req) {
  const { id } = req.params;
  try {
    const gateway = await Gateway.findByPk(id);
    if (!gateway) {
      return { status: 404, body: { message: "Not found" } };
    }
    return { status: 200, body: gateway };
  } catch (error) {
    console.error("Error fetching data:", error);
    return { status: 500, body: { message: "Internal server error." } };
  }
}

export async function fetchByIdLock(req) {
  const { id } = req.params;
  try {
    const lock = await Lock.findByPk(id);
    if (!lock) {
      return { status: 404, body: { message: "Not found" } };
    }
    return { status: 200, body: lock };
  } catch (error) {
    console.error("Error fetching data:", error);
    return { status: 500, body: { message: "Internal server error." } };
  }
}

export default {
  fetchAll,
  fetchByIdGateway,
  fetchByIdLock,
};
