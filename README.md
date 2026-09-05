# FixItNow Team B

FixItNow is a full-stack service-booking platform. The React frontend connects customers with local service providers, while the Spring Boot API handles authentication, user roles, bookings, services, reviews, payments, disputes, and chat.

## Project layout

- `backend/FixItNow` — Spring Boot API
- `frontend/fixitnow-frontend` — React application
- `database/fixitnow.sql` — MySQL schema and seed-data dump

## Requirements

- Java 17 or newer (Java 21 is supported)
- Node.js and npm

The Maven wrapper is included, so Maven does not need to be installed separately.

## Run locally

The frontend is configured to call the API at `http://localhost:8081/api`; therefore start the backend on port `8081`.

Open one PowerShell window for the backend:

```powershell
cd backend/FixItNow
$env:SERVER_PORT = '8081'
.\mvnw.cmd spring-boot:run
```

Open another PowerShell window for the frontend:

```powershell
cd frontend/fixitnow-frontend
npm install
npm start
```

The frontend normally opens at `http://localhost:3000`. If that port is busy, use a different one, for example:

```powershell
$env:PORT = '3001'
npm start
```

## Data storage and roles

All accounts—including customers, providers, and administrators—are stored in the single `users` table. The account type is stored in the `role` column as `CUSTOMER`, `PROVIDER`, or `ADMIN`; provider approval is stored separately in `approval_status`.

For a local run, the default datasource is an embedded H2 **in-memory** database (`jdbc:h2:mem:fixitnow`). Hibernate creates the tables and `backend/FixItNow/src/main/resources/data.sql` loads the seed data each time the backend starts. Consequently, registrations and other changes made while running locally are lost when the backend stops.

The seed data includes one administrator and several provider/customer accounts. Provider services and related records use foreign keys back to `users` (for example, `services.provider_id`, `bookings.provider_id`, and `bookings.customer_id`).

## Use MySQL for persistent data

Import `database/fixitnow.sql`, then start the backend with the MySQL profile and your connection settings:

```powershell
cd backend/FixItNow
$env:SERVER_PORT = '8081'
$env:SPRING_DATASOURCE_URL = 'jdbc:mysql://localhost:3306/fixitnow?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC'
$env:SPRING_DATASOURCE_USERNAME = 'root'
$env:SPRING_DATASOURCE_PASSWORD = 'your-password'
.\mvnw.cmd -Dspring-boot.run.profiles=mysql spring-boot:run
```

With this profile, accounts and application data are persisted in MySQL instead of being reset in memory.
