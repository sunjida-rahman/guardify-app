// firebaseConfig.js
import { initializeApp } from 'firebase/app'; // Initialize the Firebase app
import { browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth'; // Authentication and Persistence
import { getFirestore } from 'firebase/firestore'; // Firestore

// Your Firebase config object (replace with your own Firebase project details)
const firebaseConfig = {
  apiKey: "AIzaSyDMa0dru1vKGXSzknLbrNy9A86HVrPxIvo",
  authDomain: "guardify-a262a.firebaseapp.com",
  databaseURL: "https://guardify-a262a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "guardify-a262a",
  storageBucket: "guardify-a262a.firebasestorage.app",
  messagingSenderId: "32796812380",
  appId: "1:32796812380:web:d6106427c87f519b29b299",
  measurementId: "G-YS1Y9LXXZ8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Auth
const db = getFirestore(app);
const auth = getAuth(app);

// Enable "Remember Me" persistence
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    // Persistence successfully set
    console.log("Persistence set to local");
  })
  .catch((error) => {
    // Handle any errors
    console.error("Persistence error:", error);
  });

// Export Firestore and Auth instances
export { auth, db };
