<template>
    <div class="wrapper">
      <h1>Mappa con OpenLayers</h1>
      <div class="map-box">
        <div id="map" class="map"></div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { onMounted } from 'vue'
  import 'ol/ol.css'
  import Map from 'ol/Map'
  import View from 'ol/View'
  import TileLayer from 'ol/layer/Tile'
  import OSM from 'ol/source/OSM'
  import Feature from 'ol/Feature'
  import Point from 'ol/geom/Point'
  import VectorSource from 'ol/source/Vector'
  import VectorLayer from 'ol/layer/Vector'
  import { Icon, Style } from 'ol/style'
  import { fromLonLat } from 'ol/proj'
  
  onMounted(() => {
    const marker = new Feature({
      geometry: new Point(fromLonLat([12.4924, 41.8902])) // Roma
    })
  
    marker.setStyle(new Style({
      image: new Icon({
        src: 'https://openlayers.org/en/latest/examples/data/icon.png',
        anchor: [0.5, 1],
        scale: 0.7
      })
    }))
  
    const vectorLayer = new VectorLayer({
      source: new VectorSource({
        features: [marker]
      })
    })
  
    new Map({
      target: 'map',
      layers: [
        new TileLayer({ source: new OSM() }),
        vectorLayer
      ],
      view: new View({
        center: fromLonLat([12.4924, 41.8902]),
        zoom: 14
      })
    })
  })
  </script>
  
  <style scoped>
  .wrapper {
    padding: 2rem;
  }
  
  .map-box {
    width: 400px;
    height: 300px;
    border: 2px solid #ccc;
    border-radius: 10px;
    overflow: hidden;
  }
  
  .map {
    width: 100%;
    height: 100%;
  }
  </style>
  