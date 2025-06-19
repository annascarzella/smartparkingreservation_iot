<template>
    <div class="p-8 max-w-4xl mx-auto">
      <h1 class="text-3xl font-semibold text-center mb-6" aria-label="Mappa con OpenStreetMap">🗺️ Mappa</h1>
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
  import '@/assets/css/map.css'
  import { useGateway } from "@/composables/useGateway";
  import { useCookie } from "#app";
  import { useRouter } from "#imports";

  const { fetchAll } = useGateway();

  const res = ref();
  const router = useRouter();


  onMounted(async () => {
    // Check if the access token exists in cookies
    if (!useCookie("access_token").value) {
        console.error("No access token found in cookies.");
        router.push("/login"); // Redirect to login page
      } else {
        console.log("JWT from cookie:", useCookie("access_token").value);
    }

    try {
      res.value = await fetchAll();
    } catch (e) {
      console.error("Error fetching:", e);
      error.value =
        e.response?._data?.message || "An error occurred during registration.";
    }

    console.log("Response:", res.value);

    //

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