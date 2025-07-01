'use strict'

const aedes = require('aedes')()
const net = require('net')
const http = require('http')
const ws = require('websocket-stream')

// --- Config
const TCP_PORT = 1883        // MQTT over TCP
const WS_PORT = 8000         // MQTT over WebSocket

// --- TCP broker (standard MQTT)
const tcpServer = net.createServer(aedes.handle)
tcpServer.listen(TCP_PORT, () => {
  console.log(`MQTT TCP broker listening on port ${TCP_PORT}`)
})

// --- WebSocket broker (MQTT over WebSocket)
const httpServer = http.createServer()
ws.createServer({ server: httpServer }, aedes.handle)
httpServer.listen(WS_PORT, () => {
  console.log(`MQTT WebSocket broker listening on ws://localhost:${WS_PORT}`)
})

// --- Optional logging
aedes.on('client', client => {
  console.log(`Client connected: ${client.id}`)
})

aedes.on('clientDisconnect', client => {
  console.log(`Client disconnected: ${client.id}`)
})

aedes.on('publish', (packet, client) => {
  if (client) {
    console.log(`Client ${client.id} published to ${packet.topic}: ${packet.payload.toString()}`)
  }
})
