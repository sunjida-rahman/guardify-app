<template>
  <div class="admin-dashboard">
    <h1>👮 Admin Dashboard</h1>

    <!-- Live Tracking Alerts -->
    <section class="alert-section">
      <h2>📍 Live Tracking Alerts</h2>
      <div v-if="trackingAlerts.length === 0">No tracking alerts</div>
      <ul v-else>
        <li v-for="alert in trackingAlerts" :key="alert.id || alert.timestamp.seconds" class="alert-item">
          Name: {{ alert.name }} | Phone: {{ alert.phoneNumber }} |
          Time: {{ new Date(alert.timestamp?.toDate()).toLocaleString() }} |
          Location:
          <router-link 
            :to="{
              name: 'ShowMap', 
              query: { lat: getLat(alert.locationUrl), lng: getLng(alert.locationUrl) }
            }"
            target="_blank"
            class="location-link"
          >
            View on Map
          </router-link>
          | Message: {{ alert.message }}
        </li>
      </ul>
    </section>

    <!-- Emergency Alerts -->
    <section class="alert-section">
      <h2>🚨 Emergency Alerts</h2>
      <textarea readonly class="alerts-textarea" :value="formattedEmergencyAlerts"></textarea>
    </section>

    <!-- Missed Safety Checks -->
    <section class="alert-section">
      <h2>⏰ Missed Safety Checks</h2>
      <textarea readonly class="alerts-textarea" :value="formattedMissedAlerts"></textarea>
    </section>
  </div>
</template>

<script setup>
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { db } from "../firebase/firebaseConfig";

const trackingAlerts = ref([]);
const emergencyAlerts = ref([]);
const missedAlerts = ref([]);

let unsubscribeTracking = null;
let unsubscribeEmergency = null;
let unsubscribeMissed = null;
const notifiedMissedIds = new Set(); // prevent duplicate notifications

const dangerSoundUrl = '/danger.mp3';
const dangerAudio = new Audio(dangerSoundUrl);

const playDangerSound = () => {
  dangerAudio.play().catch((err) => {
    console.error("Audio play failed:", err);
  });
};

const notifyMissedAlert = (alert) => {
  if (Notification.permission === "granted") {
    new Notification("❗ Missed Emergency Response", {
      body: `Name: ${alert.name}\nPhone: ${alert.phone}`,
      icon: "https://cdn-icons-png.flaticon.com/512/682/682055.png"
    });
    playDangerSound();
  }
};

const subscribeToAlerts = () => {
  unsubscribeTracking = onSnapshot(
    query(collection(db, "trackingAlerts"), orderBy("timestamp", "desc")),
    (snapshot) => {
      const newAlerts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      trackingAlerts.value = newAlerts;
    }
  );

  unsubscribeEmergency = onSnapshot(
    query(collection(db, "emergency_alerts"), orderBy("timestamp", "desc")),
    (snapshot) => {
      emergencyAlerts.value = snapshot.docs.map((doc) => doc.data());
    }
  );

  unsubscribeMissed = onSnapshot(
    query(collection(db, "missedAlerts"), orderBy("timestamp", "desc")),
    (snapshot) => {
      const updated = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // Notify only new missed alerts
      for (const alert of updated) {
        if (!notifiedMissedIds.has(alert.id)) {
          notifyMissedAlert(alert);
          notifiedMissedIds.add(alert.id);
        }
      }

      missedAlerts.value = updated;
    }
  );
};

onMounted(() => {
  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission();
  }

  subscribeToAlerts();
});

onUnmounted(() => {
  if (unsubscribeTracking) unsubscribeTracking();
  if (unsubscribeEmergency) unsubscribeEmergency();
  if (unsubscribeMissed) unsubscribeMissed();
});

const formatAlert = (alert) => {
  return `Name: ${alert.name}\nPhone: ${alert.phone}\nTime: ${new Date(alert.timestamp?.toDate()).toLocaleString()}\nLocation: ${alert.locationUrl || "Not Available"}\nMessage: ${alert.message}\n---\n`;
};

const formattedEmergencyAlerts = computed(() =>
  emergencyAlerts.value.map(formatAlert).join("\n")
);

const formattedMissedAlerts = computed(() =>
  missedAlerts.value.map(formatAlert).join("\n")
);

const getLat = (url) => {
  const m = url ? url.match(/mlat=([\d.-]+)&mlon=/) : null;
  return m ? m[1] : "0";
};

const getLng = (url) => {
  const m = url ? url.match(/mlon=([\d.-]+)/) : null;
  return m ? m[1] : "0";
};
</script>

<style scoped>
.admin-dashboard {
  padding: 2rem;
  font-family: Arial, sans-serif;
  background: #f9f9f9;
}

.alert-section {
  margin-top: 2rem;
}

.alert-item {
  background: #fff;
  padding: 0.75rem;
  border-radius: 0.5rem;
  margin-bottom: 0.75rem;
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.1);
  list-style-type: none;
}

.location-link {
  color: blue;
  text-decoration: underline;
}

.alerts-textarea {
  width: 100%;
  height: 200px;
  padding: 1rem;
  font-size: 1rem;
  border-radius: 0.5rem;
  border: 1px solid #ccc;
  background-color: #fff;
  resize: none;
  white-space: pre-wrap;
}
</style>
