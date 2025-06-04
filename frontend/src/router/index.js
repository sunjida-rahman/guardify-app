// src/router/index.js
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // ✅ FIXED
import { doc, getDoc } from 'firebase/firestore';
import { createRouter, createWebHistory } from 'vue-router';
import { db } from '../firebase/firebaseConfig';

import LiveMap from '../components/LiveMap.vue';
import AdminView from '../screens/AdminView.vue';
import EmergencyAlertPage from '../screens/EmergencyAlertPage.vue';
import HomeScreen from '../screens/HomeScreen.vue';
import LoginScreen from '../screens/LoginScreen.vue';
import SignupScreen from '../screens/SignupScreen.vue';
import StartGettingTracked from '../screens/StartGettingTracked.vue';

const routes = [
  { path: '/', component: LoginScreen },
  { path: '/signup', component: SignupScreen },
  { path: '/start-tracked', component: StartGettingTracked },
  {
    path: "/emergency-alert",
    name: "EmergencyAlert",
    component: EmergencyAlertPage,
    meta: { requiresAuth: true },
  },
  {
    path: '/home',
    component: HomeScreen,
    props: (route) => ({ message: route.query.message }),
  },
  { path: '/live-map', component: LiveMap },
  {
    path: '/admin',
    name: 'admin',
    component: AdminView,
    beforeEnter: async (to, from, next) => {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        next('/');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.exists() ? userDoc.data() : null;

        if (userData && userData.isAdmin) {
          next(); // User is admin
        } else {
          next('/'); // Not an admin
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        next('/');
      }
    },
  },
  {
    path: "/show-map",
    name: "ShowMap",
    component: () => import("../components/ShowMap.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// ✅ Authentication guard (global)
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const auth = getAuth();

  onAuthStateChanged(auth, (user) => {
    if (requiresAuth && !user) {
      next("/login");
    } else {
      next();
    }
  });
});

export default router;
