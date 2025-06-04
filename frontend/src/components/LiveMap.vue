<template>
    <div id="map" style="height: 500px;"></div> <!-- Set a height for the map -->
  </template>
  
  <script>
  import L from "leaflet";
import { onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router"; // To watch query params for user location
  
  export default {
    name: "LiveMap",
    setup() {
      const map = ref(null);
      const userLocation = ref({ lat: 0, lng: 0 });
      const route = useRoute();
  
      // When the component is mounted, initialize the map
      onMounted(() => {
        const { lat, lng } = route.query;
        userLocation.value = { lat: parseFloat(lat), lng: parseFloat(lng) };
  
        // Initialize the Leaflet map
        map.value = L.map("map").setView([userLocation.value.lat, userLocation.value.lng], 13);
  
        // Set up the OpenStreetMap tile layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map.value);
  
        // Add a marker for the user's location
        L.marker([userLocation.value.lat, userLocation.value.lng]).addTo(map.value)
          .bindPopup("Your Location")
          .openPopup();
      });
  
      // Watch for changes in location (if the location is updated, recenter the map)
      watch(route, (newRoute) => {
        if (newRoute.query.lat && newRoute.query.lng) {
          const { lat, lng } = newRoute.query;
          userLocation.value = { lat: parseFloat(lat), lng: parseFloat(lng) };
  
          if (map.value) {
            map.value.setView([userLocation.value.lat, userLocation.value.lng], 13);
            L.marker([userLocation.value.lat, userLocation.value.lng]).addTo(map.value)
              .bindPopup("Updated Location")
              .openPopup();
          }
        }
      });
  
      return {
        userLocation,
      };
    },
  };
  </script>
  
  <style scoped>
  /* Optional: You can customize the map container's style here */
  #map {
    width: 100%;
    height: 500px;
  }
  </style>
  