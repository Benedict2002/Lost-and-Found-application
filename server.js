// Import required libraries
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const mysql = require('mysql2');
const cors = require('cors');
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDh7jH5ZLJZQWPXh9bBoykGGNiXoBKKqTs",
  authDomain: "lofa-ab375.firebaseapp.com",
  projectId: "lofa-ab375",
  storageBucket: "lofa-ab375.firebasestorage.app",
  messagingSenderId: "149659091368",
  appId: "1:149659091368:web:91cf5492ff81d3bdc59d9d"
};

const firebaseApp = initializeApp(firebaseConfig);
const storage = getStorage(firebaseApp);
const upload = multer({ storage: multer.memoryStorage() });

// MySQL Database Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '2024',
  database: 'lost_and_found'
});
db.connect(err => {
  if (err) throw err;
  console.log('MySQL Connected!');
});

// Create Items Table
const createTableQuery = `CREATE TABLE IF NOT EXISTS items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255),
  description TEXT,
  image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;
db.query(createTableQuery, err => {
  if (err) throw err;
  console.log('Items table ready!');
});

// Routes

// Upload Image and Create Item
app.post('/api/items', upload.single('image'), async (req, res) => {
  const { title, description } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    const storageRef = ref(storage, `images/${uuidv4()}_${file.originalname}`);
    const snapshot = await uploadBytes(storageRef, file.buffer, { contentType: file.mimetype });
    const imageUrl = await getDownloadURL(snapshot.ref);

    // Save to MySQL
    const query = 'INSERT INTO items (title, description, image_url) VALUES (?, ?, ?)';
    db.query(query, [title, description, imageUrl], (err, result) => {
      if (err) return res.status(500).send(err);
      res.status(201).json({ id: result.insertId, title, description, imageUrl });
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Fetch All Items
app.get('/api/items', (req, res) => {
  db.query('SELECT * FROM items', (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// Start Server
app.listen(3000, () => console.log('Server running on http://localhost:3000'));
