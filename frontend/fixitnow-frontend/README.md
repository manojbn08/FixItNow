# FixItNow frontend

This React application is the browser client for the FixItNow service-booking platform. It provides customer, provider, and administrator screens and calls the Spring Boot API.

## Requirements

- Node.js
- npm

## Start the app

Install dependencies once, then start the development server:

```powershell
npm install
npm start
```

The application is served at `http://localhost:3000` by default. To use another port:

```powershell
$env:PORT = '3001'
npm start
```

## Backend connection

The API base URL is defined in `src/api/api.js` as:

```text
http://localhost:8081/api
```

Start the backend from `../../backend/FixItNow` on port `8081` before using sign-in, registration, bookings, dashboards, or other data-backed functionality:

```powershell
cd ../../backend/FixItNow
$env:SERVER_PORT = '8081'
.\mvnw.cmd spring-boot:run
```

## Account data

The frontend does not persist account records. Customers, providers, and administrators are saved by the backend in its `users` table. On the default local backend configuration this is an H2 in-memory database, so data resets when the backend stops. See the repository-level README for MySQL persistence instructions.
