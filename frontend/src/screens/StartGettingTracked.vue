<template>
  <div class="tracking-page">
    <div class="tracking-card">
      <div class="icon-container">
        <svg xmlns="http://www.w3.org/2000/svg" class="tracking-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5s-3 1.343-3 3 1.343 3 3 3z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 21c-4.418 0-8-3.582-8-8a8 8 0 0116 0c0 4.418-3.582 8-8 8z" />
        </svg>
      </div>

      <h2 class="title">Start Getting Tracked</h2>

      <div class="input-group">
        <label for="name" class="label">Name</label>
        <input v-model="name" type="text" id="name" placeholder="Enter your name" class="input-field" required />
      </div>

      <div class="input-group">
        <label for="phone" class="label">Phone Number</label>
        <input v-model="phoneNumber" type="tel" id="phone" placeholder="Enter your phone number" class="input-field" required />
      </div>

      <div class="input-group">
        <button @click="startTracking" class="btn-primary" :disabled="isTracking">Start Tracking</button>
        <button @click="stopTracking" class="btn-secondary" v-if="isTracking">Stop Tracking</button>
      </div>

      <div v-if="location" class="location-display">
        <p><strong>Latitude:</strong> {{ location.lat }}</p>
        <p><strong>Longitude:</strong> {{ location.lng }}</p>
      </div>

      <div id="map" class="map-preview" v-if="location"></div>

      <button @click="sendEmergencyAlert" class="btn-danger" :disabled="!location || !phoneNumber">Send Emergency Alert</button>

      <!-- New button for sending tracking alert -->
      <button 
        @click="sendTrackingAlert" 
        class="btn-primary" 
        :disabled="!location || !phoneNumber || !name || !isTracking"
        style="margin-top: 1rem;"
      >
        Send Tracking Alert
      </button>
    </div>
  </div>
</template>

<script>
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { GeoPoint, addDoc, collection, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { onUnmounted, ref, watch } from "vue";
import { useToast } from "vue-toastification";
import { db } from "../firebase/firebaseConfig";

export default {
  setup() {
    const name = ref("");
    const phoneNumber = ref("");
    const location = ref(null);
    const isTracking = ref(false);
    const toast = useToast();
    const auth = getAuth();
    let userId = null;
    let locationInterval = null;
    let map = null;
    let marker = null;

    onAuthStateChanged(auth, (user) => {
      if (user) {
        userId = user.uid;
      }
    });

    const initializeMap = () => {
      if (!map && location.value) {
        map = L.map("map").setView([location.value.lat, location.value.lng], 16);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
        marker = L.marker([location.value.lat, location.value.lng]).addTo(map);
      }
    };

    const updateMapLocation = () => {
      if (map && marker && location.value) {
        marker.setLatLng([location.value.lat, location.value.lng]);
        map.setView([location.value.lat, location.value.lng]);
      }
    };

    const updateLocationInFirestore = async () => {
      if (!userId || !location.value) return;

      const locationUrl = `https://www.openstreetmap.org/?mlat=${location.value.lat}&mlon=${location.value.lng}#map=16/${location.value.lat}/${location.value.lng}`;

      await setDoc(
        doc(db, "users", userId),
        {
          uid: userId,
          name: name.value,
          phoneNumber: phoneNumber.value,
          location: new GeoPoint(location.value.lat, location.value.lng),
          locationUrl,
          email: auth.currentUser?.email || "",
          isAdmin: false,
          createdAt: new Date().toISOString(),
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      );
    };

    const startTracking = () => {
      if (!userId) return toast.error("Please login first.");
      if (!navigator.geolocation) return toast.error("Geolocation not supported.");
      if (!name.value || !phoneNumber.value) return toast.error("Enter name and phone number.");

      if (locationInterval) clearInterval(locationInterval);

      locationInterval = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            location.value = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            };
            updateMapLocation();
            updateLocationInFirestore();
          },
          (err) => {
            toast.error("Failed to get location: " + err.message);
          }
        );
      }, 5000);

      isTracking.value = true;
      toast.success("Tracking started!");
    };

    const stopTracking = () => {
      if (locationInterval) {
        clearInterval(locationInterval);
        locationInterval = null;
      }
      isTracking.value = false;
      toast.info("Tracking stopped.");
    };

    const sendEmergencyAlert = async () => {
      if (!userId || !location.value) return toast.error("Missing info to send alert.");

      const userDoc = await getDoc(doc(db, "users", userId));
      const userData = userDoc.exists() ? userDoc.data() : {};

      try {
        await addDoc(collection(db, "emergency_alerts"), {
          uid: userId,
          name: userData.name || "Unknown",
          phoneNumber: userData.phoneNumber || "",
          location: new GeoPoint(location.value.lat, location.value.lng),
          alertType: "Emergency",
          message: "I am in emergency",
          timestamp: serverTimestamp(),
        });
        toast.success("Emergency alert sent.");
      } catch {
        toast.error("Failed to send alert.");
      }
    };

    // New method: send Tracking Alert
    const sendTrackingAlert = async () => {
      if (!userId || !location.value) {
        return toast.error("Missing info to send tracking alert.");
      }

      const locationUrl = `https://www.openstreetmap.org/?mlat=${location.value.lat}&mlon=${location.value.lng}#map=16/${location.value.lat}/${location.value.lng}`;

      try {
        await addDoc(collection(db, "trackingAlerts"), {
          uid: userId,
          name: name.value,
          phoneNumber: phoneNumber.value,
          location: new GeoPoint(location.value.lat, location.value.lng),
          alertType: "Tracking Alert",
          message: "User started tracking",
          locationUrl,
          timestamp: serverTimestamp(),
        });
        toast.success("Tracking alert sent!");
      } catch (error) {
        toast.error("Error sending tracking alert: " + error.message);
      }
    };

    onUnmounted(() => stopTracking());

    watch(location, () => {
      if (location.value && !map) {
        setTimeout(initializeMap, 100);
      }
    });

    return {
      name,
      phoneNumber,
      location,
      isTracking,
      startTracking,
      stopTracking,
      sendEmergencyAlert,
      sendTrackingAlert,  // Expose new method
    };
  },
};
</script>

<style scoped>
/* Your existing styles untouched */
.tracking-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}
.tracking-card {
  background: #fff;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
}
.icon-container {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}
.tracking-icon {
  height: 3rem;
  width: 3rem;
  color: #4a4a4a;
}
.title {
  text-align: center;
  margin-bottom: 1rem;
}
.input-group {
  margin-bottom: 1rem;
}
.label {
  font-weight: bold;
  margin-bottom: 0.25rem;
  display: block;
}
.input-field {
  width: 100%;
  padding: 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid #ccc;
}
.btn-primary {
  background: #4caf50;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
}
.btn-secondary {
  background: #f44336;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  margin-left: 1rem;
}
.btn-danger {
  background: #e53935;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  margin-top: 1rem;
  cursor: pointer;
  width: 100%;
}
.map-preview {
  height: 250px;
  margin-top: 1rem;
  border-radius: 0.5rem;
  overflow: hidden;
}
.location-display {
  margin-top: 1rem;
  background: #f1f1f1;
  padding: 0.5rem;
  border-radius: 0.5rem;
}
</style>
