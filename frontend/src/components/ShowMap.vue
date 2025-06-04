<template>
  <div class="map-container">
    <button @click="goBack" class="back-button">← Back to Admin Dashboard</button>
    <h2>User Location on Map</h2>
    <div v-if="!lat || !lng" class="error">Invalid or missing coordinates.</div>
    <div id="map" v-show="lat && lng"></div>
  </div>
</template>

<script setup>
import L from "leaflet";
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const lat = ref(null);
const lng = ref(null);
let map = null;

onMounted(() => {
  lat.value = parseFloat(route.query.lat);
  lng.value = parseFloat(route.query.lng);

  if (!isNaN(lat.value) && !isNaN(lng.value)) {
    map = L.map("map").setView([lat.value, lng.value], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    L.marker([lat.value, lng.value])
      .addTo(map)
      .bindPopup("User Location")
      .openPopup();
  }
});

const goBack = () => {
  // Navigate explicitly to Admin Dashboard page
  router.push({ name: "admin" });
};
</script>

<style scoped>
.map-container {
  padding: 1rem;
  font-family: Arial, sans-serif;
}

.back-button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.3rem;
  cursor: pointer;
  font-size: 1rem;
  margin-bottom: 1rem;
  user-select: none;
  transition: background-color 0.3s ease;
}

.back-button:hover {
  background-color: #0056b3;
}

#error {
  color: red;
  font-weight: bold;
}

#map {
  height: 400px;
  width: 100%;
  margin-top: 1rem;
  border-radius: 0.5rem;
}
</style>
