<template>
  <Navbar />
  <router-view></router-view> <!-- Ensure it's lowercase and spelled correctly -->
</template>

<script>

import Navbar from "./components/Navbar.vue";

export default {
  components: { Navbar },
};
</script>

<style>
/* Optional: Add any additional custom styles for this component */
@import "leaflet/dist/leaflet.css";
body {
  font-family: 'Poppins', sans-serif;
  transition: background-color 0.3s, color 0.3s;
}

body.light-mode {
  background: linear-gradient(to bottom right, #e0f7fa, #fce4ec);
  color: #212529;
}

body.dark-mode {
  background-color: #121212;
  color: #f8f9fa;
}

.card {
  transition: background-color 0.3s, color 0.3s;
}

body.dark-mode .card {
  background-color: #1f1f1f;
  color: #f8f9fa;
}

.btn-toggle-dark {
  position: absolute;
  top: 20px;
  right: 20px;
}

</style>
