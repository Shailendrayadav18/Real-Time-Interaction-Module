const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert('./serviceAccount.json')
});

const db = admin.firestore();

// Routes
app.post('/api/sessions', async (req, res) => {
  const { pollQuestion, options } = req.body;
  const sessionCode = Math.random().toString(36).substr(2, 6).toUpperCase();
  try {
    await db.collection('sessions').doc(sessionCode).set({
      pollQuestion,
      options,
      createdAt: admin.firestore.Timestamp.now(),
      active: true
    });
    res.status(201).json({ sessionCode });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/responses', async (req, res) => {
  const { sessionCode, option } = req.body;
  try {
    await db.collection('responses').add({
      sessionCode,
      option,
      timestamp: admin.firestore.Timestamp.now()
    });
    res.status(200).json({ message: 'Response recorded' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const snapshot = await db.collection('sessions').orderBy('createdAt', 'desc').get();
    const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));