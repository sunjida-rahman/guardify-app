// backend/server.js
const express = require('express');
const admin = require('firebase-admin');
require('dotenv').config(); // To load sensitive data from .env file
const bodyParser = require('body-parser');
const cors = require('cors');

// Initialize express app
const app = express();
const port = 5000; // Set port to 5000 for the backend server

// Firebase Admin SDK setup
admin.initializeApp({
  credential: admin.credential.cert(require('./serviceAccountKey.json')),  // Firebase Service Account Key
  databaseURL: process.env.FIREBASE_DATABASE_URL // Firebase Database URL from .env
});

// Middleware to parse incoming JSON requests
app.use(express.json());
app.use(cors()); // Enable CORS for frontend to communicate with backend

// Test Firebase connection by reading data from the root
admin.database().ref('/').once('value')
  .then((snapshot) => {
    console.log('Firebase connected successfully, data from root:', snapshot.val());
  })
  .catch((error) => {
    console.error('Error connecting to Firebase:', error);
  });

// Route to test if the server is running
app.get('/test', (req, res) => {
  res.send('Firebase connected and server is running!');
});

// Middleware to verify Firebase ID token (for authentication)
const verifyIdToken = async (req, res, next) => {
  const idToken = req.headers.authorization;

  if (!idToken) {
    return res.status(401).send('Unauthorized: No ID token');
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;  // Attach user data to request object
    next();
  } catch (error) {
    res.status(401).send('Unauthorized: Invalid token');
  }
};

// Route to handle user login and registration
app.post('/login', verifyIdToken, async (req, res) => {
  const { isNewUser, user } = req.body;

  if (isNewUser) {
    try {
      // Store new user data in Firebase Realtime Database
      const userRef = admin.database().ref('users/' + user.uid);
      await userRef.set({
        name: user.displayName,
        email: user.email,
        uid: user.uid,
        createdAt: new Date().toISOString(),
      });

      return res.json({ message: 'New user saved to database', user: user });
    } catch (error) {
      console.error('Error saving new user:', error);
      return res.status(500).send('Error saving new user');
    }
  }

  // For existing users, you can fetch user data or process differently
  return res.json({ message: 'Existing user logged in', user: user });
});

// Route to add location data to Firebase
app.post('/add-location', (req, res) => {
  const { userId, latitude, longitude } = req.body;

  // Reference to Firebase Realtime Database for location
  const ref = admin.database().ref('locations');

  ref.push({
    userId,
    latitude,
    longitude,
    timestamp: new Date().toISOString(),
  })
    .then(() => res.status(200).send('Location added successfully!'))
    .catch((error) => {
      console.error('Error adding location:', error);
      res.status(500).send('Error adding location: ' + error);
    });
});

// Sample Route - Fetch User Data (protected route)
app.get('/user', verifyIdToken, async (req, res) => {
  const uid = req.user.uid;
  const userRef = admin.database().ref('users/' + uid);

  userRef.once('value', (snapshot) => {
    const userData = snapshot.val();
    res.json({ user: userData });
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
