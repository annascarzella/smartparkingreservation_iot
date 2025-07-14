# IOT Smart parking reservation

## Overview

This project implements a **Smart parking reservation system** designed as an IoT solution to improve urban mobility and it's based on a responsive web application where users can reserve parking slots in advance. 
Since most of the low-level details of the project couldn't be implemented due to practical constraints, both gateways and locks are simulated. 


## System components

- **Locks**: installed on individual parking slots. Feature a mechanical arm that raises/lowers based on commands

- **Gateways**: each parking lot has one gateway managing multiple locks. Act as bridges between locks and the MQTT Broker

- **MQTT**: Used for gateway-to-cloud communication. The following topics are used:
    - `/ID_gateway/up_link` – Lock status updates
    - `/ID_gateway/down_link` – Commands to locks
    - `/ID_gateway/down_link_ack` – Command acknowledgment
    - `/ID_gateway/heartbeat` – Periodic health check
      
All messages are exchanged in JSON format.

- **Node-RED**: Node-RED is used to display a real-time dashboard that includes:
    - Gateways statuses (connected, disconnected, unknown)
    - Locks statuses (reserved, occupied, free, out of order)
    - Heartbeats timestamps for each lock
    - Active reservations data
      
The following Node-RED libraries are used in this project:  
`node-red`, `node-red-contrib-aedes`, `node-red-contrib-postgresql`, `node-red-contrib-web-worldmap-cn`, `node-red-dashboard`, `node-red-node-sqlite`, `node-red-node-ui-table`.


## Requirements

To run this project locally, ensure the following tools are installed on your system:
- **Docker** 
- **Docker compose** 
- **Wokwi Simulator** (extension in Visual Studio Code)
- **dotenv** (to manage environment variables)

## Environment setup

You can start and manage the full environment using the following `just` commands:

| Command            | Description                                                                                      |
|--------------------|------------------------------------------------------------------------------------------------- |
| `just backend`     | Starts backend, database and MQTT broker                                                         |
| `just devices`     | Launches the Node.js simulated devices                                                           |
| `just wokwi`       | Prepares the Wokwi environment. Open `diagram.json` and click `Play` manually to start devices   |
| `just frontend`    | Starts the web application                                                                       |
| `just nodered`     | Launches Node-RED                                                                                |
| `just down`        | Stops all services and cleans up the environment                                                 |


## Example scenario

1. Visit the web app at: `http://localhost:3000`. 
You can either register a new account or log in with the following demo credentials:
    email: anna@gmail.com
    password: password1

2. After logging in, you will be redirected to the interactive map page.
If location sharing is enabled, the map centers around your current location to show nearby parking locks.
If location sharing is disabled, the map defaults to the area where the locks are located (currently four locks are available).
Note: Two of the locks are powered by Wokwi, while the other two are Node.js-based devices.

3. To reserve a spot, you can click on a `green lock button` on the map, and a custom dialog box will appear asking for a car plate number and the duration of the reservation (minimum 5 minutes, maximum 3 hours). Click `Reserve` to confirm and once reserved, the lock will turn blue and the lock arm is raised to reserve the spot.

4. Your active reservation appears at the bottom of the map with the following controls:
    - `Extend`: you can increase the reservation time (up to 3 hours total)
    - `Arrived?`: you have to confirm your arrival to lower the lock arm, allowing you to park
    - `Open in Google Maps (icon)`: allows you to navigate to the parking location using Google Maps
  
If the reservation expires, the lock will automatically reset to available status.

5. You can visit the Node-RED dashboard at `http://localhost:1880/ui/`

## Additional notes

The `.env` file is not included in the repository for security reasons. To run the project you need to create the file in the root directory with the following variables.

WSMQTT=ws://mqtt:8000
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_USER=your_postgres_user
POSTGRES_DB=smartparking
DB_URL=postgres://<user>:<password>@postgres:5432/smartparking
JWT_SECRET=your_jwt_secret
BACKEND_URL=http://localhost:5002/
BACKEND_PORT=5002

## Authors

- Michele Frattini [@frazzerz]
- Anna Scarzella [@annascarzella]
- Luigi Timossi [@Lurpigi]
