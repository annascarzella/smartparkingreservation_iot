'use strict'
import { getAllLocks, getGatewayById, getLocksByGatewayId } from './populate.js';
var mqtt = require('mqtt')
var client  = mqtt.connect('ws://localhost:8000')

const locks = await getAllLocks();
const gateway = await getGatewayById('gateway-1');

/*
client.on('connect', function () {
  console.log('Connected')
  client.subscribe('mytopic', function (err) {
  })
})

client.on('message', function (topic, message) {
  // message is Buffer
  console.log('Subscriber received: '+message.toString())
})

client.on('connect', function () {
  console.log('Connected')
  client.subscribe('mytopic', function (err) {
    if (!err) {
      client.publish('mytopic', 'publishing on my topic')
    }
    setInterval(function() {
      client.publish('mytopic', 'publishing on my topic')
    }, 5000);

  })
})

client.on('message', function (topic, message) {
  // message is Buffer
  console.log('Received: '+message.toString())
})
*/