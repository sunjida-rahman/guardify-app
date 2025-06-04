<template>
  <div
    class="wrapper d-flex align-items-center justify-content-center min-vh-100 flex-column"
    :style="backgroundStyle"
  >
    <button class="btn btn-secondary btn-sm btn-toggle-dark" @click="toggleDarkMode">
      {{ isDark ? '☀️ Light Mode' : '🌙 Dark Mode' }}
    </button>

    <div
      class="card shadow-lg border-0 p-4 animated-card"
      :style="cardStyle"
    >
      <div class="card-body text-center">
        <h2 class="card-title mb-4">
          👮‍♀️ Welcome to <span class="text-primary">Guardify</span>
        </h2>

        <router-link to="/start-tracked" class="btn btn-primary btn-lg w-100 mb-3">
          🚶 Start Getting Tracked
        </router-link>

        <router-link to="/emergency-alert" class="btn btn-warning btn-lg w-100 mb-3">
  🚨 Emergency Alert
</router-link>


        <router-link v-if="!isLoggedIn" to="/" class="btn btn-primary btn-lg w-100 mb-3">
          🔐 Login
        </router-link>

        <button v-else @click="logout" class="btn btn-danger btn-lg w-100 mb-3">
          🔓 Logout
        </button>

        <router-link v-if="isAdmin" to="/admin" class="btn btn-success w-100">
          🧑‍💻 Go to Admin View
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useToast } from "vue-toastification";
import ToastConfirm from "../components/ToastConfirm.vue";
import { db } from "../firebase/firebaseConfig";

export default {
  setup() {
    const toast = useToast();
    const isAdmin = ref(false);
    const isAlertOn = ref(false);
    const isDark = ref(false);
    const isLoggedIn = ref(false);
    const intervalId = ref(null);
    const missedCount = ref(0);

    const backgroundImages = [
      "https://s3.amazonaws.com/mobileappdaily/mad/uploads/img_best_women_safety_apps.png",
      "https://wallpapercave.com/wp/wp3504280.jpg",
      "https://wallpapers.com/images/featured/safety-pictures-yxhdianfjuydk3zt.jpg",
      "https://archive.factordaily.com/wp-content/uploads/2017/03/Womens_safety-_app_leadimage.jpg",
    ];
    const currentBackgroundIndex = ref(0);

    const backgroundStyle = ref({
      transition: "background-image 2s ease-in-out",
      backgroundImage: `url(${backgroundImages[0]})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      minHeight: "100vh",
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      color: "#222",
      position: "relative",
    });

    const cardStyle = computed(() => ({
      backgroundColor: isDark.value ? "rgba(34, 34, 34, 0.6)" : "rgba(255, 255, 255, 0.6)",
      color: isDark.value ? "#eee" : "#222",
      transition: "all 0.7s ease",
      transform: "translateX(15px)",
      position: "relative",
      zIndex: 1,
      width: "100%",
      maxWidth: "500px",
      backdropFilter: "blur(8px)",
      borderRadius: "1rem",
    }));

    const toggleDarkMode = () => {
      isDark.value = !isDark.value;
      backgroundStyle.value.color = isDark.value ? "#eee" : "#222";
    };

    const animateBackground = () => {
      currentBackgroundIndex.value =
        (currentBackgroundIndex.value + 1) % backgroundImages.length;
      backgroundStyle.value.backgroundImage = `url(${backgroundImages[currentBackgroundIndex.value]})`;
    };

    let bgInterval = null;
    const auth = getAuth();
    const currentUser = ref(null);

   const startCheckInterval = () => {
  intervalId.value = setInterval(() => {
    let responded = false;
    const toastId = toast(
      {
        component: ToastConfirm,
        listeners: {
          confirm: async () => {
            responded = true;
            toast.dismiss(toastId);
            toast.success("✅ Response received. Thank you!");
          },
        },
      },
      {
        timeout: false,
        closeOnClick: false,
        draggable: false,
        position: "top-center",
      }
    );

    setTimeout(async () => {
      if (!responded && currentUser.value) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.value.uid));
          const userData = userDoc.data() || {};
          const locationDoc = await getDoc(doc(db, "locations", currentUser.value.uid));
          const locationData = locationDoc.exists() ? locationDoc.data() : {};

          console.log("🔥 Missed Alert Triggered");
          console.log("User:", userData);
          console.log("Location:", locationData);

          const mapLink =
            locationData.latitude && locationData.longitude
              ? `https://www.openstreetmap.org/?mlat=${locationData.latitude}&mlon=${locationData.longitude}#map=18/${locationData.latitude}/${locationData.longitude}`
              : "Location not available";

          // Instead of missedAlerts collection, store directly in emergencyAlerts
          await setDoc(
            doc(db, "emergencyAlerts", currentUser.value.uid + "_" + Date.now()),
            {
              userId: currentUser.value.uid,
              name: userData.name || "Unknown",
              mobileNumber: userData.mobileNumber || "Unknown",
              timestamp: new Date(),
              location: locationData,
              mapLink,
              message: "User missed safety check. Emergency alert triggered.",
            }
          );

          toast.error("⚠️ No response detected. Emergency alert has been logged.");

        } catch (error) {
          console.error("❌ Emergency Alert Logging Error:", error.message);
          toast.error("❌ Failed to log emergency alert: " + error.message);
        }
      }
    }, 60000); // 60 seconds to respond

  }, 10000); // check every 10 seconds for testing
};


    const stopCheckInterval = () => {
      if (intervalId.value) {
        clearInterval(intervalId.value);
        intervalId.value = null;
      }
    };

    const toggleEmergencyAlert = async () => {
      if (!currentUser.value) return;
      const alertRef = doc(db, "emergencyAlerts", currentUser.value.uid);
      try {
        if (isAlertOn.value) {
          await deleteDoc(alertRef);
          stopCheckInterval();
          toast.success("🛑 Emergency alert has been turned off.");
        } else {
          await setDoc(alertRef, {
            userId: currentUser.value.uid,
            timestamp: new Date(),
            message: "Emergency alert activated",
          });
          startCheckInterval();
          toast.warning(
            "🚨 Emergency Alert Activated! You are being monitored now. Stay safe!"
          );
        }
        isAlertOn.value = !isAlertOn.value;
      } catch (err) {
        toast.error("❌ Failed to toggle emergency alert: " + err.message);
      }
    };

    const logout = async () => {
      try {
        stopCheckInterval();
        await signOut(auth);
        localStorage.removeItem("token");
        toast.info("👋 Logged out successfully", { timeout: 2000 });
        isLoggedIn.value = false;
        window.location.href = "/";
      } catch (error) {
        toast.error("Logout failed.");
        console.error(error);
      }
    };

    onMounted(() => {
      isDark.value = false;
      backgroundStyle.value.color = "#222";

      onAuthStateChanged(auth, async (user) => {
        currentUser.value = user;
        isLoggedIn.value = !!user;

        if (user) {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          const userData = userDoc.data() || {};
          isAdmin.value = !!userData.isAdmin;

          const alertDoc = await getDoc(doc(db, "emergencyAlerts", user.uid));
          if (alertDoc.exists()) {
            isAlertOn.value = true;
            startCheckInterval();
          } else {
            isAlertOn.value = false;
            stopCheckInterval();
          }
        } else {
          isAdmin.value = false;
          isAlertOn.value = false;
          stopCheckInterval();
        }
      });

      bgInterval = setInterval(animateBackground, 7000);
    });

    onUnmounted(() => {
      stopCheckInterval();
      if (bgInterval) clearInterval(bgInterval);
    });

    return {
      isAdmin,
      isAlertOn,
      isDark,
      backgroundStyle,
      cardStyle,
      toggleDarkMode,
      toggleEmergencyAlert,
      logout,
      isLoggedIn,
    };
  },
};
</script>

<style scoped>
.wrapper {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  transition: color 0.7s ease;
  position: relative;
  overflow: hidden;
  z-index: 0;
}

.min-vh-100 {
  min-height: 100vh !important;
}

.btn-toggle-dark {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 1050;
}

.animated-card {
  transition: transform 0.7s ease, background-color 0.7s ease, color 0.7s ease;
  transform: translateX(40px);
}
</style>
