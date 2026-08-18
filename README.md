# JJSAK Application (public/ served)

This is the JJSAK Application updated to serve the front-end from the backend (public/).
Open http://localhost:4000 in a browser after starting the server.

Start:
  npm install
  npm start

Seed admin (if using original scaffold with admin seed env vars):
  ADMIN_TSC=admin001 ADMIN_PASSWORD='VeryStrongPass123' ADMIN_NAME='Headmaster' node server.js

Notes:
- The front-end is served from / (static files in public/).
- The client uses API_BASE = '/api' so it talks to the same origin.
- For production, use HTTPS, a strong JWT_SECRET, and a proper database.
