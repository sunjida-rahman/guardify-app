<template>
  <div
    class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 px-4"
  >
    <div
      class="bg-white rounded-lg shadow-lg w-full max-w-sm p-8 flex flex-col items-center"
    >
      <!-- Logo or Brand -->
      <h1 class="text-5xl font-extrabold mb-6 text-blue-800 select-none">
        Guardify
      </h1>

      <h2 class="text-3xl font-semibold mb-8 text-gray-900 text-center">
        Welcome Back
      </h2>

      <!-- Email input -->
      <input
        v-model="email"
        type="email"
        placeholder="Email address"
        class="input-field"
        autocomplete="email"
      />

      <!-- Password input -->
      <input
        v-model="password"
        type="password"
        placeholder="Password"
        class="input-field"
        autocomplete="current-password"
      />

      <div
        class="w-full flex justify-between items-center mb-6 text-sm text-gray-700 select-none"
      >
        <label class="flex items-center space-x-2">
          <input
            type="checkbox"
            v-model="rememberMe"
            class="form-checkbox h-5 w-5 text-blue-600 rounded"
          />
          <span>Remember me</span>
        </label>

        <router-link
          to="/forgot-password"
          class="text-blue-600 font-semibold hover:underline"
        >
          Forgot Password?
        </router-link>
      </div>

      <button
        @click="login"
        class="btn-primary"
        :disabled="loading"
        type="button"
      >
        <span v-if="!loading">Log In</span>
        <span v-else>Loading...</span>
      </button>

      <p class="mt-8 text-center text-gray-700 text-sm max-w-xs leading-relaxed">
        Don't have an account?
        <router-link
          to="/signup"
          class="text-blue-600 font-semibold hover:underline"
        >
          Sign up
        </router-link>
      </p>
    </div>
  </div>
</template>

<script>
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { auth, db } from "../firebase/firebaseConfig";

export default {
  setup() {
    const email = ref("");
    const password = ref("");
    const rememberMe = ref(false);
    const loading = ref(false);
    const toast = useToast();
    const router = useRouter();

    const login = async () => {
      if (!email.value || !password.value) {
        toast.error("Please enter both email and password.");
        return;
      }

      loading.value = true;

      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email.value,
          password.value
        );
        const user = userCredential.user;

        const userRef = doc(db, "users", user.uid);
        let userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            isAdmin: false,
            createdAt: new Date().toISOString(),
          });
          userDoc = await getDoc(userRef); // refetch after creation
          console.log("User profile created in Firestore");
        }

        const token = await user.getIdToken();
        if (rememberMe.value) {
          localStorage.setItem("token", token);
        } else {
          sessionStorage.setItem("token", token);
        }

        const userData = userDoc.data();

        if (userData.isAdmin) {
          await router.push("/admin");
        } else {
          await router.push("/home");
        }

        toast.success("Logged in successfully 🚀", { timeout: 3000 });
      } catch (error) {
        toast.error("Error: " + error.message);
      } finally {
        loading.value = false;
      }
    };

    return { email, password, rememberMe, login, loading };
  },
};
</script>

<style scoped>
.input-field {
  @apply w-full px-4 py-3 mb-5 border border-gray-300 rounded-md
    shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none
    focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition;
}

.btn-primary {
  @apply w-full bg-blue-600 text-white font-semibold py-3 rounded-md
    hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>
