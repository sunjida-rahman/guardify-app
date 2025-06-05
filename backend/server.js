
const fs = require('fs');
const express = require('express');
const admin = require('firebase-admin');
require('dotenv').config();
const cors = require('cors');

let serviceAccount;

// If running locally (serviceAccountKey.json file exists), load from file
if (fs.existsSync('./serviceAccountKey.json')) {
  serviceAccount = require('./serviceAccountKey.json');
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  // If running on Railway or other env, parse env variable string and fix newlines
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  // Replace literal "\\n" with real newlines "\n" in private_key
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
} else {
  console.error('No Firebase service account key found!');
  process.exit(1);
}
// Initialize express app
const app = express();
const port = process.env.PORT || 5000;

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

// Middleware
app.use(express.json());
app.use(cors());

// Test Firebase connection
admin.database().ref('/').once('value')
  .then((snapshot) => {
    console.log('Firebase connected successfully, data from root:', snapshot.val());
  })
  .catch((error) => {
    console.error('Error connecting to Firebase:', error);
  });

// Routes
app.get('/test', (req, res) => {
  res.send('Firebase connected and server is running!');
});

const verifyIdToken = async (req, res, next) => {
  const idToken = req.headers.authorization;

  if (!idToken) {
    return res.status(401).send('Unauthorized: No ID token');
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).send('Unauthorized: Invalid token');
  }
};

app.post('/login', verifyIdToken, async (req, res) => {
  const { isNewUser, user } = req.body;

  if (isNewUser) {
    try {
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

  return res.json({ message: 'Existing user logged in', user: user });
});

app.post('/add-location', (req, res) => {
  const { userId, latitude, longitude } = req.body;

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
