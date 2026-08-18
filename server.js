// JJSAK Application - server.js (serves public/ and enables CORS)
// Minimal demo server with a joke endpoint that proxies external APIs.

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const https = require('https');

const APP_PORT = process.env.PORT || 4000;
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const RECORDS_FILE = path.join(DATA_DIR, 'records.json');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static front-end
const PUBLIC_DIR = path.join(__dirname, 'public');
app.use(express.static(PUBLIC_DIR));

async function ensureDataFiles() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  // Create empty users and records files if missing
  try {
    await fs.access(USERS_FILE);
  } catch (err) {
    await fs.writeFile(USERS_FILE, JSON.stringify([], null, 2), 'utf8');
  }

  try {
    await fs.access(RECORDS_FILE);
  } catch (err) {
    await fs.writeFile(RECORDS_FILE, JSON.stringify([], null, 2), 'utf8');
  }
}

function fetchJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', reject);
  });
}

// Joke proxy endpoint: GET /api/joke
app.get('/api/joke', async (req, res) => {
  try {
    const jokeData = await fetchJson('https://icanhazdadjoke.com/', {
      Accept: 'application/json',
      'User-Agent': 'JJSAK-demo-app (https://github.com/jothambarasawatila-collab/jjsak)'
    });

    return res.json({ ok: true, source: 'icanhazdadjoke', joke: jokeData.joke });
  } catch (err) {
    console.error('Joke fetch error:', err && err.message ? err.message : err);
    // Fallback to Official Joke API
    try {
      const fallback = await fetchJson('https://official-joke-api.appspot.com/random_joke', {
        Accept: 'application/json'
      });
      return res.json({ ok: true, source: 'official-joke-api', joke: `${fallback.setup} ${fallback.punchline}` });
    } catch (err2) {
      console.error('Fallback joke fetch failed:', err2 && err2.message ? err2.message : err2);
      return res.status(502).json({ ok: false, error: 'Could not fetch joke' });
    }
  }
});

// Simple health check
app.get('/api/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

// Fallback route to serve index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Start server
ensureDataFiles()
  .then(() => {
    app.listen(APP_PORT, () => {
      console.log(`JJSAK demo app listening on http://localhost:${APP_PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to prepare data files:', err);
    process.exit(1);
  });
