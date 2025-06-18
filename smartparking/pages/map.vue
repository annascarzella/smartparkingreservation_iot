<template>
    <div class="p-8 max-w-4xl mx-auto">
      <h1 class="text-3xl font-semibold text-center mb-6" aria-label="Mappa con OpenStreetMap">🗺️ Mappa - Roma</h1>
      <div ref="mapContainer" class="h-[500px] rounded-2xl overflow-hidden shadow-lg border border-gray-200" />
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  let map
  const mapContainer = ref(null)
  
  onMounted(async () => {
    const maplibregl = await import('maplibre-gl')
    const Maplibre = maplibregl.default
  
    map = new Maplibre.Map({
      container: mapContainer.value,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [12.4964, 41.9028], // Roma
      zoom: 12
    })
  
    // Aggiungiamo il marker solo quando la mappa è pronta
    map.on('load', () => {
      new Maplibre.Marker()
        .setLngLat([12.4964, 41.9028])
        .addTo(map)
    })
  })
  </script>
  
  <style scoped>
  .maplibregl-canvas {
    border-radius: 1rem; /* 16px */
  }
  </style>
  