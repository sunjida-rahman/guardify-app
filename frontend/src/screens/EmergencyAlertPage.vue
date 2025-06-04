<template>
  <div class="container mt-5">
    <h2 class="mb-4 text-center">🚨 Emergency Alert Mode</h2>
    <form @submit.prevent="startEmergencyMonitoring" v-if="!isMonitoring">
      <div class="mb-3">
        <label class="form-label">Name</label>
        <input v-model="name" class="form-control" required />
      </div>
      <div class="mb-3">
        <label class="form-label">Phone Number</label>
        <input v-model="phone" class="form-control" required />
      </div>
      <button class="btn btn-danger w-100">Activate Emergency Alert</button>
    </form>

    <div v-else class="text-center">
      <p class="fw-bold">🛡️ Emergency Alert is Active. Respond to prompts!</p>
      <button class="btn btn-secondary mt-3" @click="stopMonitoring">🛑 Stop Monitoring</button>
    </div>
  </div>
</template>

<script>
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onMounted, ref } from "vue";
import { useToast } from "vue-toastification";
import ToastConfirm from "../components/ToastConfirm.vue";
import { db } from "../firebase/firebaseConfig";

export default {
  setup() {
    const name = ref("");
    const phone = ref("");
    const isMonitoring = ref(false);
    const intervalId = ref(null);
    const toast = useToast();

    const auth = getAuth();

    onMounted(() => {
      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          toast.error("You must be logged in to use Emergency Alert Mode.");
          window.location.href = "/login"; // redirect
        } else {
          try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              name.value = data.name || "";
              phone.value = data.phone || "";
              console.log("✅ User data pre-filled:", name.value, phone.value);
            }
          } catch (err) {
            console.error("Failed to fetch user info:", err);
          }
        }
      });
    });

    const startEmergencyMonitoring = () => {
      isMonitoring.value = true;

      intervalId.value = setInterval(() => {
        const responded = ref(false);

        const toastId = toast(
          {
            component: ToastConfirm,
            listeners: {
              confirm: () => {
                responded.value = true;
                toast.dismiss(toastId);
                toast.success("✅ Response recorded.");
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
          if (!responded.value) {
            const timestamp = new Date();
            try {
              await setDoc(
                doc(db, "missedAlerts", `${phone.value}_${timestamp.getTime()}`),
                {
                  name: name.value,
                  phone: phone.value,
                  timestamp,
                  message: "Missed emergency alert response.",
                }
              );
              toast.error("⚠️ Missed alert. Logged to admin.");
            } catch (error) {
              toast.error("❌ Failed to log missed alert.");
              console.error("Firestore error:", error);
            }
          }
        }, 30000); // 30 seconds to respond
      }, 10000); // every 10 seconds
    };

    const stopMonitoring = () => {
      if (intervalId.value) {
        clearInterval(intervalId.value);
        intervalId.value = null;
      }
      isMonitoring.value = false;
      toast.info("🛑 Emergency Monitoring Stopped.");
    };

    return {
      name,
      phone,
      isMonitoring,
      startEmergencyMonitoring,
      stopMonitoring,
    };
  },
};
</script>

<style scoped>
.container {
  max-width: 500px;
}
</style>
