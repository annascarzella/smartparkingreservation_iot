<template>
  <div class="p-8 max-w-4xl mx-auto">
    <h1 class="text-3xl font-semibold text-center mb-6" aria-label="Mappa con OpenStreetMap">🗺️ Mappa</h1>
    <div class="map-box">
      <div id="map" class="map"></div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import 'ol/ol.css'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import XYZ from 'ol/source/XYZ';
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import VectorSource from 'ol/source/Vector'
import Cluster from 'ol/source/Cluster'
import VectorLayer from 'ol/layer/Vector'
import { Style, Icon, Circle as CircleStyle, Fill, Stroke, Text } from 'ol/style'
import { fromLonLat } from 'ol/proj'
import '@/assets/css/map.css'
import { useGateway } from "@/composables/useGateway";
import { useCookie } from "#app";
import { useRouter } from "#imports";

const { fetchAll } = useGateway();
const res = ref();
const router = useRouter();

onMounted(async () => {
  if (!useCookie("access_token").value) {
    console.error("No access token found in cookies.");
    router.push("/login");
    return;
  }

  try {
    res.value = await fetchAll();
  } catch (e) {
    console.error("Error fetching:", e);
    return;
  }

  console.log("Response:", res.value);

  const view = new View({
    center: fromLonLat([12.4924, 41.8902]), // Default: Rome
    zoom: 14
  });



  const statusColorMap = {
    reserved: 'yellow',
    occupied: 'red',
    free: 'green',
    out_of_order: 'gray'
  };

  const lockFeatures = [];
  if (res.value.locks && Array.isArray(res.value.locks)) {
    res.value.locks.forEach(lock => {
      const lat = parseFloat(lock.latitude);
      const lon = parseFloat(lock.longitude);
      if (isNaN(lat) || isNaN(lon)) return;
      const feat = new Feature({
        geometry: new Point(fromLonLat([lon, lat])),
        lockId: lock.id,
        lockStatus: lock.status
      });
      const color = statusColorMap[lock.status] || 'blue';  // Cluster color
      feat.setStyle(new Style({
        image: new CircleStyle({
          radius: 8,
          fill: new Fill({ color }),
          stroke: new Stroke({ color: '#fff', width: 2 })
        })
      }));
      lockFeatures.push(feat);
    });
  }

  const lockSource = new VectorSource({ // VectorSource per i lock
    features: lockFeatures
  });

  const clusterSource = new Cluster({  // Distanza in pixel
    distance: 40,
    source: lockSource
  });

  const clusterLayer = new VectorLayer({
    source: clusterSource,
    style: function(feature) {
      const features = feature.get('features');
      if (features.length > 1) {
        return new Style({ // cluster, cerchio con numero
          image: new CircleStyle({
            radius: 15,
            fill: new Fill({ color: 'rgba(0, 153, 255, 0.9)' }),
            stroke: new Stroke({ color: '#fff', width: 2 })
          }),
          text: new Text({
            text: String(features.length),
            fill: new Fill({ color: '#000' }),
            stroke: new Stroke({ color: '#fff', width: 2 }),
            font: '12px sans-serif'
          })
        });
      } else {
        return features[0].getStyle(); // riusa lo style già assegnato alla sotto-feature
      }
    }
  });

  const map = new Map({
    target: 'map',
    layers: [
      new TileLayer({
        source: new XYZ({
          url: 'https://cartodb-basemaps-{a-c}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
          // attributions: '© OpenStreetMap contributors, © CARTO',
          // subdomains: ['a', 'b', 'c'],
          maxZoom: 19
        })
      }),
      clusterLayer
    ],
    view: view
  });

  // Event click
  map.on('singleclick', function(evt) {
    map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
      const feats = feature.get('features');
      if (feats && feats.length > 1) {
        const extent = feature.getGeometry().getExtent(); // zoom in per cluster
        map.getView().fit(extent, { duration: 500, maxZoom: 18 });
      } else if (feats && feats.length === 1) {
        const single = feats[0];
        const lockId = single.get('lockId');
        alert(`Lock ID: ${lockId}`);
      }
      return true;
    });
  });

// Geolocation prompt
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLon = position.coords.longitude;
        const userLat = position.coords.latitude;
        const userLonLat = fromLonLat([userLon, userLat]);

        // Create a feature for the user's position
        const userLocationFeature = new Feature({
          geometry: new Point(userLonLat),
          name: 'Your Location'
        });

        // Style the user location with an icon or circle
        userLocationFeature.setStyle(new Style({
          image: new Icon({
            src: 'https://cdn-icons-png.flaticon.com/512/64/64113.png', // Or use your own icon URL
            scale: 0.05, // Adjust the scale as needed
            anchor: [0.5, 1]
          })
        }));

        // Create a vector source and layer
        const userLocationSource = new VectorSource({
          features: [userLocationFeature]
        });

        const userLocationLayer = new VectorLayer({
          source: userLocationSource
        });

        // Add the layer to the map
        map.addLayer(userLocationLayer);

        // Center map on user
        view.setCenter(userLonLat);
        view.setZoom(16);

      },
      (error) => {
        console.warn("Geolocation denied or failed:", error.message);
        // fallback: fit to lock data
        if (lockFeatures.length > 0) {
          const extent = lockSource.getExtent();
          map.getView().fit(extent, { padding: [50, 50, 50, 50], maxZoom: 16 });
        }
      }


    );
  } else {
    console.warn("Geolocation not supported by this browser.");
    if (lockFeatures.length > 0) {
      const extent = lockSource.getExtent();
      map.getView().fit(extent, { padding: [50, 50, 50, 50], maxZoom: 16 });
    }
  }

});
</script>
