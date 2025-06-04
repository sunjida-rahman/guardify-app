<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 px-4"
  >
    <div
      class="bg-white rounded-lg shadow-lg w-full max-w-sm p-8 flex flex-col items-center"
    >
      <!-- Brand -->
      <h1 class="text-5xl font-extrabold mb-6 text-blue-800 select-none text-center">
        Guardify
      </h1>

      <h2 class="text-3xl font-semibold mb-8 text-gray-900 text-center">
        Create Account
      </h2>

      <!-- Each input in its own block with margin -->
      <div class="w-full mb-4">
        <input
          v-model="name"
          type="text"
          placeholder="Full Name"
          class="input-field"
          autocomplete="name"
        />
      </div>

      <div class="w-full mb-4">
        <input
          v-model="email"
          type="email"
          placeholder="Email Address"
          class="input-field"
          autocomplete="email"
        />
      </div>

      <div class="w-full mb-6">
        <input
          v-model="password"
          type="password"
          placeholder="Password (min 6 characters)"
          class="input-field"
          autocomplete="new-password"
        />
      </div>

      <div class="w-full mb-6">
        <button
          @click="signup"
          class="btn-primary w-full"
          :disabled="loading"
          type="button"
        >
          <span v-if="!loading">Sign Up</span>
          <span v-else>Registering...</span>
        </button>
      </div>

      <router-link
        to="/"
        class="text-blue-600 font-semibold hover:underline text-sm text-center"
      >
        Already have an account? Login
      </router-link>
    </div>
  </div>
</template>

<script>
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { ref } from "vue";
import { useToast } from "vue-toastification";
import { auth } from "../firebase/firebaseConfig";

export default {
  setup() {
    const name = ref("");
    const email = ref("");
    const password = ref("");
    const loading = ref(false);
    const toast = useToast();

    const isValidEmail = (email) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const signup = async () => {
      if (!name.value || !email.value || !password.value) {
        toast.error("Please fill in all fields.");
        return;
      }

      if (!isValidEmail(email.value)) {
        toast.error("Please enter a valid email address.");
        return;
      }

      if (password.value.length < 6) {
        toast.error("Password must be at least 6 characters long.");
        return;
      }

      loading.value = true;

      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email.value,
          password.value
        );

        await updateProfile(userCredential.user, {
          displayName: name.value,
        });

        const token = await userCredential.user.getIdToken();
        localStorage.setItem("token", token);

        toast.success("Registered successfully 🎉", { timeout: 3000 });
        window.location.href = "/home";
      } catch (error) {
        toast.error("Error: " + error.message);
      } finally {
        loading.value = false;
      }
    };

    return { name, email, password, signup, loading };
  },
};
</script>

<style scoped>
.input-field {
  @apply w-full px-4 py-3 border border-gray-300 rounded-md
    shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none
    focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition;
}

.btn-primary {
  @apply bg-blue-600 text-white font-semibold py-3 rounded-md
    hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>
