# FixItNow — Complete Technical Documentation

> **Project Name:** FixItNow  
> **Team:** Team B (Infosys Springboard)  
> **Version:** 1.0.0  
> **Architecture:** Full-Stack Monorepo — Spring Boot (Backend) + React (Frontend)  
> **Last Updated:** July 2026

---

## Table of Contents

1. [What is FixItNow?](#1-what-is-fixitnow)
2. [Problem Statement and Solution](#2-problem-statement-and-solution)
3. [High-Level Architecture](#3-high-level-architecture)
4. [Tech Stack and Justification](#4-tech-stack-and-justification)
5. [Why This Tech Stack Over Others](#5-why-this-tech-stack-over-others)
6. [How to Run the Project](#6-how-to-run-the-project)
7. [Project Structure — Full File Tree](#7-project-structure--full-file-tree)
8. [Database Design and Schema](#8-database-design-and-schema)
9. [Backend — Detailed File-by-File Breakdown](#9-backend--detailed-file-by-file-breakdown)
10. [Frontend — Detailed File-by-File Breakdown](#10-frontend--detailed-file-by-file-breakdown)
11. [REST API Reference (All Endpoints)](#11-rest-api-reference-all-endpoints)
12. [Security Architecture (JWT Flow)](#12-security-architecture-jwt-flow)
13. [WebSocket / Real-Time Chat Architecture](#13-websocket--real-time-chat-architecture)
14. [Key Features of the Project](#14-key-features-of-the-project)
15. [Important Code Snippets (with Explanation)](#15-important-code-snippets-with-explanation)
16. [What Makes This Project Better Than Others](#16-what-makes-this-project-better-than-others)
17. [Design Patterns Used](#17-design-patterns-used)
18. [Interview QandA — Every Possible Question](#18-interview-qa--every-possible-question)

---

## 1. What is FixItNow?

**FixItNow** is a full-stack **Service Booking Platform** that connects **customers** who need home/office repair services (Electrical, Plumbing, Carpentry, etc.) with **verified service providers** who can fulfill those requests. An **admin** panel oversees provider approvals, dispute resolution, and platform analytics.

Think of it as an **Urban Company / TaskRabbit clone** built from scratch using **Spring Boot + React**.

### Core User Roles

| Role | Description |
|------|-------------|
| **CUSTOMER** | Browses services, books appointments, makes payments, leaves reviews, raises disputes |
| **PROVIDER** | Registers with ID proof, creates service listings, accepts/rejects bookings, earns via wallet |
| **ADMIN** | Approves/rejects provider registrations, resolves disputes, views platform analytics |

---

## 2. Problem Statement and Solution

### Problem
- Customers struggle to find **verified, reliable** local service providers.
- There is no centralized platform for **booking, paying, chatting, and reviewing** service providers.
- Providers lack a professional platform to **list services, manage bookings, and receive payments**.
- There is no mechanism for **dispute resolution** or **quality assurance** in most local service marketplaces.

### Solution — FixItNow
- A **three-role platform** (Customer, Provider, Admin) with end-to-end service lifecycle management.
- **JWT-secured** authentication with provider verification workflow.
- **Real-time chat** (WebSocket + STOMP) between customer-provider and admin-provider.
- **Geolocation-based service search** with map integration (Leaflet + Google Maps API).
- **Digital wallet system** for provider earnings.
- **Dispute resolution system** with multi-status workflow.
- **AI-powered onboarding assistant** widget for guided help.

---

## 3. High-Level Architecture

```
+----------------------------------------------------------+
|                     BROWSER (React SPA)                  |
|  +---------+ +----------+ +----------+ +-------------+  |
|  | Landing  | | Customer | | Provider | |   Admin     |  |
|  |  Page    | |Dashboard | |Dashboard | | Dashboard   |  |
|  +----+----+ +----+-----+ +----+-----+ +------+------+  |
|       |           |            |               |         |
|       v           v            v               v         |
|  +-----------------------------------------------------+ |
|  |           Axios HTTP Client (api.js)                | |
|  |           + WebSocket (STOMP over SockJS)            | |
|  +------------------------+----------------------------+ |
+---------------------------+------------------------------+
                            |  HTTP REST / WebSocket
                            v
+----------------------------------------------------------+
|               SPRING BOOT BACKEND (Port 8080)            |
|                    Context Path: /api                     |
|  +-----------------------------------------------------+ |
|  |              Security Layer (JWT Filter)             | |
|  |    JwtAuthenticationFilter -> JwtTokenProvider       | |
|  |    SecurityConfig (URL-based + Method-level)         | |
|  +------------------------+----------------------------+ |
|                           |                              |
|  +------------------------v----------------------------+ |
|  |               Controller Layer (REST APIs)          | |
|  |  Auth | Booking | Service | Review | Chat | Admin   | |
|  |  Category | Payment | Dispute                       | |
|  +------------------------+----------------------------+ |
|                           |                              |
|  +------------------------v----------------------------+ |
|  |               Service Layer (Business Logic)        | |
|  |  AuthenticationService | BookingService | ChatService| |
|  |  ReviewService | ServiceOfferService |CategoryService| |
|  +------------------------+----------------------------+ |
|                           |                              |
|  +------------------------v----------------------------+ |
|  |              Repository Layer (Spring Data JPA)     | |
|  |  UserRepo | BookingRepo | ServiceRepo | ReviewRepo  | |
|  |  PaymentRepo | DisputeRepo | ChatMessageRepo        | |
|  +------------------------+----------------------------+ |
|                           |                              |
|  +------------------------v----------------------------+ |
|  |                  Database Layer                     | |
|  |       H2 (In-Memory, default) / MySQL (prod)       | |
|  +-----------------------------------------------------+ |
+----------------------------------------------------------+
```

---

## 4. Tech Stack and Justification

### Backend

| Technology | Version | Purpose | Why Chosen |
|---|---|---|---|
| **Java** | 17 | Programming language | Industry standard for enterprise apps, strong typing, mature ecosystem |
| **Spring Boot** | 3.3.0 | Backend framework | Auto-configuration, embedded server, massive ecosystem, production-ready |
| **Spring Security** | 6.x | Authentication and authorization | De facto standard for securing Java applications |
| **Spring Data JPA** | 3.x | ORM / Database access | Eliminates boilerplate SQL, automatic query generation |
| **Spring WebSocket** | 3.x | Real-time bidirectional communication | STOMP over SockJS for live chat |
| **JJWT** | 0.12.3 | JWT token creation and validation | Most popular Java JWT library, HMAC-SHA512 signing |
| **Lombok** | 1.18.38 | Boilerplate reduction | Auto-generates getters/setters/builders/constructors |
| **H2 Database** | Runtime | In-memory DB for development | Zero-config, instant startup, MySQL mode compatibility |
| **MySQL** | 8.0 | Production database | ACID-compliant, relational, widely deployed |
| **BCrypt** | (Spring Security) | Password hashing | Adaptive hashing function, industry best practice |
| **Maven** | 3.x | Build tool and dependency management | Standard for Java projects |

### Frontend

| Technology | Version | Purpose | Why Chosen |
|---|---|---|---|
| **React** | 19.x | UI library | Component-based, virtual DOM, largest ecosystem |
| **React Router DOM** | 7.x | Client-side routing | Declarative routing with protected routes |
| **Axios** | 1.x | HTTP client | Promise-based, request/response interceptors for JWT |
| **Framer Motion** | 12.x | Animations | Smooth page transitions and micro-animations |
| **Recharts** | 3.x | Data visualization | Admin analytics dashboards with charts |
| **Leaflet + React-Leaflet** | 5.x | Map integration | Free, open-source alternative to Google Maps for UI |
| **jwt-decode** | 4.x | Client-side JWT parsing | Decode JWT claims without backend call |

### Database

| Technology | Purpose |
|---|---|
| **H2 (Default)** | In-memory database for zero-config local development, MySQL mode enabled |
| **MySQL 8.0 (Production)** | Full relational database with ACID compliance |

---

## 5. Why This Tech Stack Over Others

### Spring Boot vs. Node.js/Express

| Criteria | Spring Boot (Chosen) | Node.js/Express |
|---|---|---|
| **Type Safety** | Strongly typed (Java) | Loosely typed (JS) |
| **Enterprise Readiness** | Built for enterprise | Requires more manual setup |
| **Security** | Spring Security is industry standard | Passport.js is less comprehensive |
| **ORM** | JPA/Hibernate is battle-tested | Sequelize/TypeORM are less mature |
| **WebSocket** | STOMP protocol with built-in auth | Socket.IO needs custom auth |
| **Performance** | Multi-threaded, handles concurrent requests | Single-threaded event loop |
| **Community** | 20+ years of Java enterprise community | Large but more startup-focused |

### React vs. Angular vs. Vue

| Criteria | React (Chosen) | Angular | Vue |
|---|---|---|---|
| **Learning Curve** | Gentle | Steep | Gentle |
| **Ecosystem** | Largest | Complete but opinionated | Smaller |
| **Performance** | Virtual DOM | Change detection overhead | Virtual DOM |
| **Flexibility** | Library, pick your tools | Full framework, prescriptive | Progressive |
| **Job Market** | Highest demand | High | Growing |
| **Animation** | Framer Motion | Angular Animations | Vue transitions |

### MySQL vs. MongoDB vs. PostgreSQL

| Criteria | MySQL (Chosen) | MongoDB | PostgreSQL |
|---|---|---|---|
| **Data Model** | Relational (perfect for bookings/users) | Document (schema-less) | Relational |
| **ACID Compliance** | Full | Limited | Full |
| **JPA Support** | Native | Requires Spring Data MongoDB | Native |
| **Learning Curve** | Most widely taught | Different paradigm | More complex |
| **Community** | Largest RDBMS community | Large NoSQL community | Growing |

### JWT vs. Session-based Auth

| Criteria | JWT (Chosen) | Session-based |
|---|---|---|
| **Stateless** | No server-side session storage needed | Requires session store (Redis) |
| **Scalability** | Easy horizontal scaling | Sticky sessions or shared store |
| **Mobile Ready** | Token works across platforms | Cookies don't work well on mobile |
| **Cross-Origin** | Bearer token in header | Cookie SameSite/CORS issues |
| **WebSocket Auth** | Token passed in STOMP headers | Requires cookie forwarding |

---

## 6. How to Run the Project

### Prerequisites
- **Java 17+** (JDK)
- **Maven 3.6+** (or use the included Maven wrapper `mvnw.cmd`)
- **Node.js 18+** and **npm 9+**

### Step 1: Run the Backend

```powershell
cd backend/FixItNow

# Option A: Use Maven wrapper
./mvnw.cmd spring-boot:run

# Option B: Use system Maven
mvn spring-boot:run
```

- Backend starts at: `http://localhost:8080/api`
- Default DB: **H2 in-memory** (no MySQL needed for dev)
- H2 Console: `http://localhost:8080/api/h2-console`
- Seed data is auto-loaded from `data.sql`

### Step 2: Run the Frontend

```powershell
cd frontend/fixitnow-frontend
npm install
npm start
```

- Frontend starts at: `http://localhost:3000`
- API calls go to: `http://localhost:8081/api` (configured in `api.js`)

### Step 3 (Optional): Use MySQL

```powershell
# Import the database dump
mysql -u root -p < database/fixitnow.sql

# Run backend with MySQL profile
mvn spring-boot:run -Dspring.profiles.active=mysql
```

### Default Seed Users

| Role | Email | Notes |
|------|-------|-------|
| ADMIN | admin@example.com | Full platform access |
| PROVIDER | alice456@gmail.com | Electrical services, approved |
| CUSTOMER | john456@gmail.com | Sample customer |
| PROVIDER | bob456@gmail.com | Plumbing services |
| PROVIDER | charlie456@gmail.com | Plumbing services |

---

## 7. Project Structure — Full File Tree

```
FixItNow-Team-B-main/
|-- .gitignore
|-- README.md
|
|-- database/
|   +-- fixitnow.sql                          # MySQL dump (full schema + seed data)
|
|-- backend/FixItNow/
|   |-- pom.xml                                # Maven build config + all dependencies
|   |-- mvnw.cmd                               # Maven wrapper for Windows
|   |-- .mvn/wrapper/maven-wrapper.properties  # Maven wrapper config
|   |
|   +-- src/main/
|       |-- resources/
|       |   |-- application.properties         # Main config (H2, JWT, server port)
|       |   |-- application-mysql.properties   # MySQL profile config
|       |   |-- data.sql                       # Seed data (users, categories, services, bookings)
|       |   +-- sql/                           # Additional SQL scripts
|       |
|       +-- java/com/fixitnow/
|           |-- FixItNowBackendApplication.java    # @SpringBootApplication entry point
|           |-- CorsConfig.java                     # Global CORS configuration
|           |
|           |-- config/
|           |   |-- SecurityConfig.java             # Spring Security filter chain
|           |   |-- WebSocketConfig.java            # STOMP WebSocket configuration
|           |   |-- GoogleMapsConfig.java            # Google Maps REST client config
|           |   |-- GoogleMapsApiProperties.java     # Maps API property binding
|           |   +-- AppConfigProperties.java         # App-level property binding
|           |
|           |-- security/
|           |   |-- JwtTokenProvider.java            # JWT create / validate / parse
|           |   |-- JwtAuthenticationFilter.java     # OncePerRequestFilter for JWT
|           |   |-- JwtAuthenticationEntryPoint.java # 401 error handler
|           |   +-- CustomUserDetailsService.java    # UserDetailsService implementation
|           |
|           |-- model/             (JPA Entities)
|           |   |-- User.java                        # Users table (all 3 roles)
|           |   |-- UserRole.java                    # Enum: CUSTOMER, PROVIDER, ADMIN
|           |   |-- ApprovalStatus.java              # Enum: PENDING, APPROVED, ON_HOLD
|           |   |-- Service.java                     # Service listings
|           |   |-- Category.java                    # Service categories
|           |   |-- Subcategory.java                 # Service subcategories
|           |   |-- Booking.java                     # Booking records
|           |   |-- BookingStatus.java               # Enum: PENDING->CONFIRMED->COMPLETED->PAID
|           |   |-- Review.java                      # Customer reviews
|           |   |-- ReviewNotification.java          # Provider notification on new review
|           |   |-- Payment.java                     # Payment records
|           |   |-- Dispute.java                     # Dispute records
|           |   |-- DisputeStatus.java               # Enum: OPEN->UNDER_REVIEW->RESOLVED
|           |   |-- ChatMessage.java                 # Customer <-> Provider messages
|           |   +-- AdminProviderMessage.java        # Admin <-> Provider messages
|           |
|           |-- dto/               (Data Transfer Objects)
|           |   |-- ApiResponse.java                 # Generic wrapper: {success, message, data}
|           |   |-- SignUpRequest.java                # Registration request DTO
|           |   |-- LoginRequest.java                 # Login request DTO
|           |   |-- JwtAuthenticationResponse.java    # Login/register response with token
|           |   |-- UserInfoDTO.java                  # User details DTO
|           |   |-- ServiceDTO.java                   # Create/update service request
|           |   |-- ServiceResponseDTO.java           # Service details response
|           |   |-- BookingDTO.java                    # Booking details DTO
|           |   |-- CreateBookingRequest.java          # Create booking request
|           |   |-- BookingActionRequest.java          # Accept/reject/cancel request
|           |   |-- BookingWithAlternativesResponse.java # Fallback booking response
|           |   |-- AlternativeProviderDTO.java        # Alternative provider info
|           |   |-- SlotDTO.java                       # Available time slot
|           |   |-- CategoryDTO.java                   # Category details
|           |   |-- SubcategoryDTO.java                # Subcategory details
|           |   |-- ReviewDTO.java                     # Review details
|           |   |-- ReviewCreateRequest.java           # Create review request
|           |   |-- ReviewNotificationDTO.java         # Review notification details
|           |   |-- ProviderRatingDTO.java              # Provider rating summary
|           |   |-- PaymentDTO.java                     # Payment details
|           |   |-- PaymentRequest.java                 # Process payment request
|           |   |-- ChatMessageDTO.java                 # Chat message DTO
|           |   |-- ChatMessageRequest.java             # Send chat message request
|           |   |-- AdminChatDTO.java                   # Admin chat message DTO
|           |   |-- AdminChatRequest.java               # Admin chat request
|           |   |-- DisputeDTO.java                     # Dispute details
|           |   |-- DisputeRequest.java                 # Raise dispute request
|           |   |-- DisputeActionRequest.java           # Respond/resolve dispute
|           |   +-- AnalyticsDTO.java                   # Platform analytics data
|           |
|           |-- repository/        (Spring Data JPA Repositories)
|           |   |-- UserRepository.java
|           |   |-- ServiceRepository.java
|           |   |-- BookingRepository.java
|           |   |-- CategoryRepository.java
|           |   |-- SubcategoryRepository.java
|           |   |-- ReviewRepository.java
|           |   |-- ReviewNotificationRepository.java
|           |   |-- PaymentRepository.java
|           |   |-- DisputeRepository.java
|           |   |-- ChatMessageRepository.java
|           |   +-- AdminProviderMessageRepository.java
|           |
|           |-- service/           (Business Logic Layer)
|           |   |-- AuthenticationService.java        # Register, login, JWT generation
|           |   |-- BookingService.java                # Booking lifecycle + alternative providers
|           |   |-- ServiceOfferService.java           # CRUD + search + nearby services
|           |   |-- ReviewService.java                 # Reviews + notifications
|           |   |-- CategoryService.java               # Category/subcategory management
|           |   +-- ChatService.java                   # Chat messaging logic
|           |
|           +-- controller/        (REST API Layer)
|               |-- AuthenticationController.java      # /auth/login, /auth/register, /auth/signup
|               |-- BookingController.java             # /bookings/* (CRUD + slots + fallback)
|               |-- ServiceController.java             # /services/* (CRUD + search + nearby)
|               |-- ReviewController.java              # /reviews/* (CRUD + notifications)
|               |-- CategoryController.java            # /categories/* (CRUD)
|               |-- ChatController.java                # /chats/* (REST + WebSocket)
|               |-- PaymentController.java             # /payments/* (pay + wallet)
|               |-- DisputeController.java             # /disputes/* (raise + respond + resolve)
|               +-- AdminController.java               # /admin/* (providers + analytics)
|
+-- frontend/fixitnow-frontend/
    |-- package.json                               # npm dependencies and scripts
    |-- public/                                    # Static assets
    |
    +-- src/
        |-- index.js                               # ReactDOM entry point
        |-- index.css                              # Global styles
        |-- App.js                                 # Router + route definitions
        |
        |-- api/
        |   |-- api.js                             # Axios instance + JWT interceptor
        |   |-- bookings.js                        # Booking API calls
        |   +-- assistant.js                       # AI assistant API calls
        |
        |-- auth/
        |   |-- AuthContext.js                     # React Context for auth state
        |   +-- localAuth.js                       # Local storage auth utilities
        |
        |-- components/
        |   |-- ProtectedRoute.js                  # Role-based route guard
        |   |-- AiHelpWidget.js                    # AI onboarding chatbot widget
        |   +-- AiHelpWidget.css                   # AI widget styling
        |
        |-- layout/
        |   |-- Layout.js                          # Base layout wrapper
        |   |-- Navbar.js                          # Top navigation bar
        |   |-- Sidebar.js                         # Sidebar component
        |   |-- PortalLayout.js                    # Dashboard layout (sidebar + topbar + content)
        |   +-- PortalLayout.css                   # Portal layout styles
        |
        |-- pages/
        |   |-- LandingPage.js                     # Public landing/marketing page
        |   |-- Login.js                           # Login form
        |   |-- Register.js                        # Registration form (Customer/Provider)
        |   |-- ProviderPendingApproval.js          # Provider approval waiting page
        |   |-- CustomerDashboard.js               # Customer dashboard (51KB, full-featured)
        |   |-- ProviderDashboard.js                # Provider dashboard (48KB, full-featured)
        |   |-- AdminDashboard.js                   # Admin dashboard (38KB, full-featured)
        |   |-- ServiceDetail.js                    # Service detail page
        |   |-- MapBookingSearch.js                 # Map-based service search (customer)
        |   +-- MapProviderSearch.js                # Map-based provider search
        |
        +-- state/
            +-- AppDataContext.js                   # Global state management (69KB)
```

---

## 8. Database Design and Schema

### Entity-Relationship Diagram (Conceptual)

```
+----------+     1:N     +----------+     N:1     +----------+
|  Users   |<------------|Services  |------------>|Categories|
|(All Roles|             |          |             |          |
| CUSTOMER |             +----+-----+             +----+-----+
| PROVIDER |                  |                        |
| ADMIN)   |                  | 1:N                    | 1:N
+----+-----+             +----v-----+             +----v--------+
     |                   | Bookings |             |Subcategories |
     | 1:N               |          |             +--------------+
     |              +----+          +----+
     |              |    +----+-----+    |
     |              |         |          |
     |    +---------v--+ +---v----+ +---v------+
     |    |  Payments   | |Reviews | | Disputes |
     |    +------------+ +--------+ +----------+
     |
     | 1:N
+----v-----------+          +----------------------+
| ChatMessages   |          | AdminProviderMessages |
|(Customer<->Prov)|         |    (Admin <-> Prov)   |
+----------------+          +----------------------+
     | N:1
+----v------------------+
|ReviewNotifications    |
+-----------------------+
```

### Table Definitions

#### `users` Table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | Primary key |
| name | VARCHAR(255) | NOT NULL | User's full name |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Login email |
| password | VARCHAR(255) | NOT NULL | BCrypt hashed password |
| role | ENUM | NOT NULL | CUSTOMER, PROVIDER, ADMIN |
| approval_status | ENUM | DEFAULT APPROVED | PENDING, APPROVED, ON_HOLD |
| location | VARCHAR(255) | | City/area text |
| phone | VARCHAR(255) | | Contact number |
| service_type | VARCHAR(255) | | Provider's specialty (e.g., "Electrical") |
| id_proof_type | VARCHAR(255) | | AADHAR, PAN, etc. |
| id_proof_document_name | VARCHAR(255) | | Document reference |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Account active flag |
| wallet_balance | DECIMAL(10,2) | DEFAULT 0.00 | Provider earnings wallet |
| created_at | DATETIME | AUTO | Account creation timestamp |
| updated_at | DATETIME | AUTO | Last update timestamp |

#### `services` Table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | Primary key |
| provider_id | BIGINT | FK -> users(id), NOT NULL | Service creator |
| category | VARCHAR(255) | NOT NULL | e.g., "Electrical" |
| subcategory | VARCHAR(255) | | e.g., "Fan Repair / Installation" |
| description | TEXT | | Service description |
| price | DECIMAL(10,2) | NOT NULL | Price in local currency |
| availability | VARCHAR(255) | | e.g., "Mon-Sat 9AM-6PM" |
| duration_minutes | INTEGER | DEFAULT 120 | Service duration |
| location | VARCHAR(255) | | Service area |
| latitude | DECIMAL(10,8) | | Geolocation lat |
| longitude | DECIMAL(11,8) | | Geolocation lng |
| average_rating | DECIMAL(3,2) | DEFAULT 0.00 | Average review score |
| review_count | INTEGER | DEFAULT 0 | Number of reviews |
| created_at | DATETIME | AUTO | Listing creation time |

#### `bookings` Table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | Primary key |
| customer_id | BIGINT | FK -> users(id), NOT NULL | Who booked |
| provider_id | BIGINT | FK -> users(id), NOT NULL | Who serves |
| service_id | BIGINT | FK -> services(id), NOT NULL | Which service |
| booking_date | DATE | NOT NULL | Appointment date |
| time_slot | VARCHAR(255) | NOT NULL | e.g., "09:00 - 11:00" |
| status | ENUM | NOT NULL, DEFAULT PENDING | PENDING->CONFIRMED->COMPLETED->PAID |
| created_at | DATETIME | AUTO | Booking creation time |

#### `reviews` Table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | Primary key |
| service_id | BIGINT | FK -> services(id), NOT NULL | Reviewed service |
| customer_id | BIGINT | FK -> users(id), NOT NULL | Reviewer |
| provider_id | BIGINT | FK -> users(id), NOT NULL | Reviewed provider |
| rating | INTEGER | NOT NULL | 1-5 stars |
| comment | TEXT | | Review text |
| created_at | DATETIME | AUTO | Review creation |
| updated_at | DATETIME | AUTO | Last update |
| **UNIQUE** | | (service_id, customer_id) | One review per service per customer |

#### `payments` Table
| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| booking_id | BIGINT | FK -> bookings(id) |
| customer_id | BIGINT | FK -> users(id) |
| provider_id | BIGINT | FK -> users(id) |
| amount | DECIMAL(10,2) | Payment amount |
| payment_date | DATETIME | Timestamp |

#### `disputes` Table
| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| booking_id | BIGINT | FK -> bookings(id) |
| customer_id | BIGINT | FK -> users(id) |
| provider_id | BIGINT | FK -> users(id) |
| issue_description | VARCHAR(1000) | Customer's complaint |
| provider_response | VARCHAR(1000) | Provider's response |
| admin_notes | VARCHAR(1000) | Admin resolution notes |
| status | ENUM | OPEN->UNDER_REVIEW->PROVIDER_RESPONDED->ESCALATED->REFUND_IN_PROGRESS->REFUNDED/REJECTED/RESOLVED |
| resolved_at | DATETIME | When resolved |
| created_at | DATETIME | When raised |
| updated_at | DATETIME | Last update |

#### `chat_messages` Table
| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| booking_id | BIGINT | FK -> bookings(id) — conversation context |
| sender_id | BIGINT | FK -> users(id) |
| receiver_id | BIGINT | FK -> users(id) |
| content | TEXT | Message body |
| sent_at | DATETIME | Timestamp |

#### `admin_provider_messages` Table
| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| sender_id | BIGINT | FK -> users(id) (Admin or Provider) |
| receiver_id | BIGINT | FK -> users(id) (Admin or Provider) |
| content | TEXT | Message body |
| sent_at | DATETIME | Timestamp |

#### `categories` and `subcategories` Tables
- Categories: Electrical, Plumbing, Carpentry
- Subcategories linked by `category_id` FK

#### `review_notifications` Table
- Notifies providers when they receive a new review
- Tracks read/unread status

---

## 9. Backend — Detailed File-by-File Breakdown

### Entry Point
**`FixItNowBackendApplication.java`** — The `@SpringBootApplication` class with `main()`. Uses `@ComponentScan(basePackages = "com.fixitnow")` to scan all packages.

### Configuration Layer (`config/`)

| File | Purpose |
|------|---------|
| `SecurityConfig.java` | Defines the Spring Security filter chain — CSRF disabled, CORS configured, stateless sessions, URL-level authorization rules, JWT filter registration |
| `WebSocketConfig.java` | STOMP over SockJS configuration — message broker (`/topic`, `/queue`), app prefix (`/app`), JWT authentication on WebSocket CONNECT, subscription authorization |
| `CorsConfig.java` | Global CORS configuration allowing `http://localhost:3000` |
| `GoogleMapsConfig.java` | REST client bean for Google Maps API integration |
| `AppConfigProperties.java` | Binds `app.*` properties |

### Security Layer (`security/`)

| File | Purpose |
|------|---------|
| `JwtTokenProvider.java` | Creates JWT tokens (HS512 HMAC signing), validates tokens, extracts email from claims. Uses JJWT 0.12.3 new API (`Jwts.parser().verifyWith()`) |
| `JwtAuthenticationFilter.java` | `OncePerRequestFilter` — intercepts every HTTP request, extracts Bearer token, validates, and sets `SecurityContextHolder` authentication |
| `JwtAuthenticationEntryPoint.java` | Handles 401 unauthorized responses with detailed JSON error messages |
| `CustomUserDetailsService.java` | Loads user from DB by email, maps `UserRole` to `GrantedAuthority` (without ROLE_ prefix) |

### Model Layer (`model/`) — 15 JPA Entities

Each entity uses **Lombok** annotations (`@Getter`, `@Setter`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor`) and **JPA** annotations (`@Entity`, `@Table`, `@ManyToOne`, etc.).

### DTO Layer (`dto/`) — 27 Data Transfer Objects

DTOs isolate the API contract from internal entities. Key pattern:

```java
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
}
```

Every API response is wrapped in `ApiResponse<T>` for consistent structure.

### Repository Layer (`repository/`) — 11 JPA Repositories

All extend `JpaRepository<Entity, Long>`. Key custom queries:
- `UserRepository`: `findByEmail()`, `existsByEmail()`, `findByRoleAndApprovalStatus()`
- `BookingRepository`: `findByCustomerId()`, `findByProviderIdAndStatus()`
- `ServiceRepository`: Geo-spatial queries for nearby service search

### Service Layer (`service/`) — 6 Business Logic Classes

| File | Responsibilities |
|------|-----------------|
| `AuthenticationService.java` | User registration (with BCrypt), login (with Spring AuthenticationManager), JWT generation, provider approval gating |
| `BookingService.java` | Create bookings with conflict detection, time slot generation, booking lifecycle (accept/reject/complete/cancel), alternative provider fallback |
| `ServiceOfferService.java` | CRUD for service listings, search by category/location/price, geo-spatial nearby search using Haversine formula |
| `ReviewService.java` | Create/update/delete reviews, recalculate service average ratings, review notifications for providers |
| `CategoryService.java` | CRUD for categories and subcategories |
| `ChatService.java` | Send/receive messages for booking chat and admin-provider chat |

### Controller Layer (`controller/`) — 9 REST Controllers

Each controller uses `@RestController`, `@RequestMapping`, and `@CrossOrigin`. All responses use `ApiResponse<T>`.

---

## 10. Frontend — Detailed File-by-File Breakdown

### Entry Point (`index.js`)

```javascript
<AuthProvider>       // Auth context wrapping
  <AppDataProvider>  // Global state wrapping
    <App />          // Router
  </AppDataProvider>
</AuthProvider>
```

### Routing (`App.js`)

| Route | Component | Access |
|-------|-----------|--------|
| `/` | `LandingPage` | Public |
| `/login` | `Login` | Public |
| `/register` | `Register` | Public |
| `/pending-approval` | `ProviderPendingApproval` | Public |
| `/customer/*` | `CustomerDashboard` | Protected (CUSTOMER) |
| `/provider/*` | `ProviderDashboard` | Protected (PROVIDER) |
| `/admin/*` | `AdminDashboard` | Protected (ADMIN) |

### API Layer (`api/`)

| File | Purpose |
|------|---------|
| `api.js` | Axios instance with `baseURL: http://localhost:8081/api`, JWT interceptor that adds `Authorization: Bearer <token>` to every request |
| `bookings.js` | Booking CRUD API functions |
| `assistant.js` | AI assistant help API call |

### Auth Layer (`auth/`)

| File | Purpose |
|------|---------|
| `AuthContext.js` | React Context providing `user`, `login()`, `logout()`, `updateUser()`. Restores auth from localStorage on mount. Decodes JWT to extract role. |
| `localAuth.js` | Local storage utilities for offline/demo auth — email normalization, role resolution from JWT claims, local account management |

### Components (`components/`)

| File | Purpose |
|------|---------|
| `ProtectedRoute.js` | Route guard — redirects to `/login` if `!user` or `user.role !== allowedRole` |
| `AiHelpWidget.js` | Floating AI chatbot widget — sends questions to backend AI assistant, provides context-aware help for Customer/Provider roles |
| `AiHelpWidget.css` | Styling for the AI widget |

### Layout (`layout/`)

| File | Purpose |
|------|---------|
| `PortalLayout.js` | Dashboard layout with sidebar navigation, topbar with user info/avatar, animated content area using Framer Motion. Icon map auto-assigns emojis to nav labels. |
| `PortalLayout.css` | Comprehensive portal styling (17KB) — sidebar, topbar, nav links, badges, responsive design |
| `Navbar.js` | Top navigation bar with user display and logout |
| `Sidebar.js` | Sidebar component |
| `Layout.js` | Base layout wrapper |

### Pages (`pages/`) — 10 Pages

| File | Size | Description |
|------|------|-------------|
| `LandingPage.js` | 31KB | Marketing page with hero section, service categories, features, CTA |
| `Login.js` | 15KB | Login form with JWT auth, error handling, role-based redirect |
| `Register.js` | 26KB | Multi-step registration (Customer vs Provider), ID proof upload for providers |
| `ProviderPendingApproval.js` | 4KB | Waiting screen that polls `/auth/provider-status` |
| `CustomerDashboard.js` | 52KB | **Full customer portal** — browse services, manage bookings, chat with providers, view/make payments, raise disputes, write reviews, map search |
| `ProviderDashboard.js` | 49KB | **Full provider portal** — manage services, handle bookings, view earnings, wallet, chat, review notifications, admin messages |
| `AdminDashboard.js` | 38KB | **Full admin portal** — provider approvals, all disputes, platform analytics (Recharts), admin-provider chat |
| `ServiceDetail.js` | 27KB | Service details page with booking form, reviews, provider info |
| `MapBookingSearch.js` | 32KB | Leaflet map-based service search with filtering |
| `MapProviderSearch.js` | 28KB | Leaflet map-based provider search |

### State Management (`state/`)

| File | Purpose |
|------|---------|
| `AppDataContext.js` | **69KB** — Centralized global state using React Context. Manages all data fetching, caching, and state for services, bookings, reviews, payments, disputes, chat, and admin data. Acts as a single source of truth for the entire app. |

---

## 11. REST API Reference (All Endpoints)

### Authentication (`/auth`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/auth/signup` | Public | Register new user |
| POST | `/auth/register` | Public | Alias for signup (frontend uses this) |
| POST | `/auth/login` | Public | Authenticate and get JWT token |
| GET | `/auth/validate` | Auth | Validate JWT token |
| GET | `/auth/provider-status?email=` | Public | Check provider approval status |

### Services (`/services`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/services` | Public | List all services (paginated) |
| GET | `/services/{id}` | Public | Get service by ID |
| GET | `/services/provider/{providerId}` | Public | Get all services by provider |
| GET | `/services/search` | Public | Search by category, location, price range |
| GET | `/services/search/nearby` | Public | Geo-spatial search within radius |
| GET | `/services/health-check` | Public | Service controller health check |
| POST | `/services` | PROVIDER/ADMIN | Create new service |
| PUT | `/services/{id}` | PROVIDER/ADMIN | Update service |
| DELETE | `/services/{id}` | PROVIDER/ADMIN | Delete service |

### Bookings (`/bookings`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/bookings` | Auth (Customer) | Create booking |
| POST | `/bookings/with-fallback` | Auth (Customer) | Create with auto-fallback to alternative provider |
| GET | `/bookings/{id}` | Auth | Get booking by ID |
| GET | `/bookings/customer/my-bookings` | Auth (Customer) | My bookings |
| GET | `/bookings/customer/confirmed` | Auth (Customer) | My confirmed bookings |
| GET | `/bookings/provider/my-bookings` | Auth (Provider) | Provider's bookings |
| GET | `/bookings/provider/pending` | Auth (Provider) | Pending requests |
| GET | `/bookings/provider/completed` | Auth (Provider) | Completed bookings |
| GET | `/bookings/provider/pending-count` | Auth (Provider) | Pending count |
| GET | `/bookings/available-slots/{serviceId}?date=` | Public | Available time slots |
| GET | `/bookings/provider/{providerId}/available` | Auth | Check slot availability |
| GET | `/bookings/alternatives` | Auth | Available alternative providers |
| GET | `/bookings/alternatives-all` | Auth | All alternative providers |
| PATCH | `/bookings/{id}/accept` | Auth (Provider) | Accept booking |
| PATCH | `/bookings/{id}/reject` | Auth (Provider) | Reject booking |
| PATCH | `/bookings/{id}/complete` | Auth (Provider) | Mark completed |
| PATCH | `/bookings/{id}/cancel` | Auth (Customer) | Cancel booking |

### Reviews (`/reviews`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/reviews` | Auth | Create review |
| GET | `/reviews/{reviewId}` | Auth | Get review by ID |
| GET | `/reviews/service/{serviceId}` | Auth | Reviews for a service |
| GET | `/reviews/provider/{providerId}` | Auth | Reviews for a provider |
| GET | `/reviews/provider/{providerId}/summary` | Auth | Rating summary |
| GET | `/reviews/provider/my` | Auth (Provider) | My received reviews |
| GET | `/reviews/provider/my/notifications` | Auth (Provider) | Review notifications |
| GET | `/reviews/provider/my/notifications/unread-count` | Auth (Provider) | Unread count |
| PUT | `/reviews/{reviewId}` | Auth | Update review |
| DELETE | `/reviews/{reviewId}` | Auth | Delete review |
| PATCH | `/reviews/provider/my/notifications/{id}/read` | Auth (Provider) | Mark as read |
| PATCH | `/reviews/provider/my/notifications/read-all` | Auth (Provider) | Mark all as read |

### Payments (`/payments`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/payments/pay` | CUSTOMER | Process payment (credits provider wallet) |
| GET | `/payments/provider/{id}` | PROVIDER | Provider payment history |
| GET | `/payments/customer/{id}` | CUSTOMER | Customer payment history |
| GET | `/payments/wallet/{providerId}` | PROVIDER/ADMIN | Provider wallet balance |

### Disputes (`/disputes`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/disputes/raise` | CUSTOMER | Raise a dispute |
| GET | `/disputes/customer/{id}` | CUSTOMER | My disputes |
| GET | `/disputes/provider/{id}` | PROVIDER | Disputes against me |
| GET | `/disputes/all` | ADMIN | All platform disputes |
| PUT | `/disputes/{id}/respond` | PROVIDER | Respond to dispute |
| PUT | `/disputes/{id}/resolve` | ADMIN | Resolve/update dispute |

### Chat (`/chats`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/chats/send` | Auth | Send message in booking chat |
| GET | `/chats/{bookingId}/history` | Auth | Chat history for booking |
| POST | `/chats/admin/send` | Auth | Send admin-provider message |
| GET | `/chats/admin/{providerId}/history` | Auth | Admin-provider chat history |

### WebSocket Endpoints

| STOMP Destination | Direction | Description |
|---|---|---|
| `/app/chat.send` | Client to Server | Send booking chat message |
| `/app/chat.admin.send` | Client to Server | Send admin-provider message |
| `/topic/chat/{bookingId}` | Server to Client | Receive booking messages (subscribe) |
| `/topic/admin-chat/{providerId}` | Server to Client | Receive admin-provider messages |

### Admin (`/admin`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/admin/providers/pending` | ADMIN | Pending provider registrations |
| GET | `/admin/providers/all` | ADMIN | All providers |
| PUT | `/admin/providers/{id}/approve` | ADMIN | Approve provider |
| PUT | `/admin/providers/{id}/hold` | ADMIN | Put provider on hold |
| PUT | `/admin/providers/{id}/reject` | ADMIN | Reject provider |
| GET | `/admin/analytics` | ADMIN | Platform analytics dashboard data |

### Categories (`/categories`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/categories` | Public | List all categories |
| POST | `/categories` | ADMIN | Create category |
| GET | `/categories/{id}/subcategories` | Public | List subcategories |
| POST | `/categories/{id}/subcategories` | ADMIN | Create subcategory |

---

## 12. Security Architecture (JWT Flow)

### Registration Flow

```
Client                          Server
  |                               |
  |  POST /auth/register          |
  |  {name, email, password,      |
  |   role, location, phone,      |
  |   idProofType, ...}           |
  |------------------------------>|
  |                               |  1. Check email uniqueness
  |                               |  2. BCrypt hash password
  |                               |  3. Set approvalStatus:
  |                               |     PROVIDER -> PENDING
  |                               |     CUSTOMER/ADMIN -> APPROVED
  |                               |  4. Save to DB
  |                               |  5. Generate JWT token
  |  {token, tokenType:"Bearer",  |
  |   expiresIn, user:{...}}      |
  |<------------------------------|
```

### Login Flow

```
Client                          Server
  |                               |
  |  POST /auth/login             |
  |  {email, password}            |
  |------------------------------>|
  |                               |  1. AuthenticationManager.authenticate()
  |                               |  2. BCrypt password comparison
  |                               |  3. If PROVIDER && status != APPROVED -> REJECT
  |                               |  4. Generate JWT (HS512, 24h expiry)
  |  {token, user:{id, role,...}} |
  |<------------------------------|
  |                               |
  |  Store token in localStorage  |
```

### Request Authentication Flow

```
Client                          JWT Filter                    Controller
  |                               |                              |
  |  GET /bookings/customer/...   |                              |
  |  Authorization: Bearer xxx    |                              |
  |------------------------------>|                              |
  |                               | 1. Extract token from header |
  |                               | 2. JwtTokenProvider.validate |
  |                               | 3. Extract email from claims |
  |                               | 4. Load UserDetails from DB  |
  |                               | 5. Set SecurityContext       |
  |                               |----------------------------->|
  |                               |                              | Process request
  |  Response                     |                              |
  |<------------------------------+------------------------------|
```

### JWT Token Structure

```
Header:  { "alg": "HS512" }
Payload: { "sub": "user@email.com", "iat": 1711290000, "exp": 1711376400 }
Signature: HMACSHA512(base64(header) + "." + base64(payload), secret)
```

- **Secret:** Base64-encoded key from `app.jwtSecret` in application.properties
- **Expiry:** 24 hours (86400000 ms)
- **Algorithm:** HS512 (HMAC-SHA512)

---

## 13. WebSocket / Real-Time Chat Architecture

```
+--------------+         +-------------------------+
|   React App  |         |    Spring Boot Server    |
|              |         |                          |
|  SockJS      |<=======>|  STOMP Endpoint: /ws     |
|  Client      |   WS    |                          |
|              |         |  Message Broker:          |
|  Subscribe:  |         |    /topic/* (broadcast)   |
|  /topic/chat/|         |    /queue/* (user-specific)|
|  {bookingId} |         |                          |
|              |         |  App Prefix: /app         |
|  Send to:    |         |                          |
|  /app/chat.  |         |  JWT Auth on CONNECT      |
|  send        |         |  Subscription validation  |
+--------------+         +-------------------------+
```

### Authentication on WebSocket
1. Client sends `Authorization: Bearer <token>` in STOMP CONNECT headers
2. `WebSocketConfig` interceptor validates JWT on CONNECT
3. Sets `UsernamePasswordAuthenticationToken` as the principal
4. On SUBSCRIBE, validates the user is authorized for that topic:
   - `/topic/chat/{bookingId}` — User must be the customer or provider of that booking
   - `/topic/admin-chat/{providerId}` — User must be an admin or the specific provider

---

## 14. Key Features of the Project

### 1. Multi-Role Authentication System
- Three distinct roles: CUSTOMER, PROVIDER, ADMIN
- Provider approval workflow (PENDING -> APPROVED by admin)
- BCrypt password hashing
- JWT-based stateless authentication (24h token expiry)

### 2. Service Marketplace
- Providers create service listings with category, subcategory, price, location, availability
- Geo-spatial search ("services within X km of my location")
- Category and subcategory taxonomy
- Average rating and review count on each service

### 3. Smart Booking System
- Time slot generation based on service duration and provider availability
- Conflict detection (double-booking prevention)
- **Alternative provider fallback** — if primary provider is busy, system suggests available providers in the same category
- Booking lifecycle: PENDING -> CONFIRMED -> COMPLETED -> PAID (or CANCELLED)

### 4. Real-Time Chat (WebSocket)
- Customer-Provider chat scoped to a booking
- Admin-Provider chat for administrative communication
- STOMP protocol over SockJS with JWT authentication
- REST fallback for clients that can't use WebSocket

### 5. Payment and Wallet System
- Customers pay after service completion
- Payment credited to provider's digital wallet
- Wallet balance tracking
- Payment history for both sides

### 6. Review and Rating System
- Customers leave star ratings (1-5) and comments
- Automatic service average rating recalculation
- Review notifications for providers (read/unread)
- One review per service per customer (unique constraint)

### 7. Dispute Resolution
- Customers raise disputes against completed bookings
- Multi-status workflow: OPEN -> UNDER_REVIEW -> PROVIDER_RESPONDED -> ESCALATED -> REFUNDED/REJECTED/RESOLVED
- Provider response mechanism
- Admin resolution with notes

### 8. Admin Analytics Dashboard
- Most booked services
- Top providers by rating, jobs completed, earnings
- Location-based demand trends
- Total revenue, open disputes count, pending provider verifications
- Interactive charts using Recharts

### 9. Map-Based Search
- Leaflet map integration for visual service/provider search
- Radius-based nearby service discovery
- Interactive markers with service details

### 10. AI Onboarding Assistant
- Floating chatbot widget on Customer and Provider dashboards
- Context-aware help based on user role and current screen
- Fallback local responses when backend AI is unavailable
- Auto-opens on first visit

### 11. Provider Verification Workflow
- Providers submit ID proof (type + document name) during registration
- Admin reviews and approves/holds/rejects
- Providers cannot login until approved
- Pending approval page with auto-polling

---

## 15. Important Code Snippets (with Explanation)

### 1. JWT Token Generation (`JwtTokenProvider.java`)

```java
public String generateToken(Authentication authentication) {
    String email = authentication.getName();
    Date now = new Date();
    Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

    return Jwts.builder()
            .subject(email)            // User's email as subject
            .issuedAt(now)             // Token creation time
            .expiration(expiryDate)    // 24-hour expiry
            .signWith(getSigningKey()) // HS512 HMAC signing
            .compact();
}

private SecretKey getSigningKey() {
    byte[] keyBytes = Base64.getDecoder().decode(jwtSecret);
    return Keys.hmacShaKeyFor(keyBytes);
}
```

**Why important:** This is the core of the authentication system. The token is signed with HMAC-SHA512 using a Base64-decoded secret key. The subject is the user's email, which is later used to look up the user in the database.

---

### 2. Security Filter Chain (`SecurityConfig.java`)

```java
http
    .csrf(csrf -> csrf.disable())                    // JWT = stateless = no CSRF
    .cors(cors -> cors.configurationSource(...))     // Allow React frontend
    .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
    .authorizeHttpRequests(authz -> authz
        .requestMatchers("/ws/**").permitAll()        // WebSocket handshake
        .requestMatchers(HttpMethod.GET, "/services/**").permitAll()  // Public browse
        .requestMatchers("/auth/**").permitAll()      // Login/register
        .requestMatchers("/admin/**").hasAuthority("ADMIN")  // Admin only
        .requestMatchers(HttpMethod.POST, "/services/**")
            .hasAnyAuthority("PROVIDER", "ADMIN")
        .requestMatchers("/bookings/**").authenticated()     // Must be logged in
        .anyRequest().authenticated()
    );

http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
```

**Why important:** This defines the entire security policy. Note how GET on services is public (so customers can browse without login), but POST/PUT/DELETE requires PROVIDER or ADMIN role. The JWT filter runs before Spring's default authentication filter.

---

### 3. Provider Registration with Approval Gating (`AuthenticationService.java`)

```java
UserRole role = signUpRequest.getRole();

// Providers require admin approval before login
ApprovalStatus approvalStatus = (role == UserRole.PROVIDER) 
    ? ApprovalStatus.PENDING 
    : ApprovalStatus.APPROVED;

User user = User.builder()
        .name(signUpRequest.getName())
        .email(signUpRequest.getEmail())
        .password(passwordEncoder.encode(signUpRequest.getPassword()))
        .role(role)
        .approvalStatus(approvalStatus)
        .build();
```

**Why important:** This shows the differentiated registration flow — customers are immediately approved, but providers start as PENDING and must wait for admin approval. This ensures service quality on the platform.

---

### 4. Booking with Alternative Provider Fallback (`BookingController.java`)

```java
try {
    booking = bookingService.createBooking(customerId, request);
} catch (IllegalArgumentException e) {
    if (e.getMessage().contains("conflicting bookings")) {
        alternatives = bookingService.findAlternativeProviders(
            request.getServiceId(), request.getBookingDate(), request.getTimeSlot()
        );
        if (autoFallback && !alternatives.isEmpty()) {
            CreateBookingRequest fallbackRequest = CreateBookingRequest.builder()
                .serviceId(alternatives.get(0).getServiceId())
                .bookingDate(request.getBookingDate())
                .timeSlot(request.getTimeSlot())
                .build();
            booking = bookingService.createBooking(customerId, fallbackRequest);
        }
    }
}
```

**Why important:** This is a unique feature — when a provider has a conflict, instead of just failing, the system automatically finds alternative providers in the same category and optionally auto-books with the first available one. This improves the customer experience significantly.

---

### 5. Axios JWT Interceptor (`api.js`)

```javascript
const API = axios.create({
  baseURL: "http://localhost:8081/api"
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});
```

**Why important:** This interceptor automatically attaches the JWT token to every API request, so individual API calls don't need to worry about authentication. The token is stored in localStorage after login.

---

### 6. React Protected Route (`ProtectedRoute.js`)

```javascript
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRole && user.role !== allowedRole) return <Navigate to="/login" replace />;
  return children;
};
```

**Why important:** This component wraps all dashboard routes to ensure only authenticated users with the correct role can access them. A CUSTOMER cannot navigate to `/provider/*` and vice versa.

---

### 7. WebSocket CONNECT Authentication (`WebSocketConfig.java`)

```java
if (StompCommand.CONNECT.equals(accessor.getCommand())) {
    List<String> authorization = accessor.getNativeHeader("Authorization");
    if (authorization != null && !authorization.isEmpty()) {
        String token = authorization.get(0).substring(7); // Remove "Bearer "
        if (jwtTokenProvider.validateToken(token)) {
            String email = jwtTokenProvider.getEmailFromToken(token);
            UserDetails userDetails = userDetailsService.loadUserByUsername(email);
            UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities());
            accessor.setUser(auth); // Set principal for this WS session
        }
    }
}
```

**Why important:** This ensures WebSocket connections are authenticated with the same JWT token used for REST APIs. The token is validated on CONNECT, and the user principal is set for the entire WebSocket session.

---

### 8. Payment with Wallet Credit (`PaymentController.java`)

```java
Payment payment = Payment.builder()
    .booking(booking)
    .amount(request.getAmount())
    .customer(booking.getCustomer())
    .provider(booking.getProvider())
    .build();
paymentRepository.save(payment);

booking.setStatus(BookingStatus.PAID);
bookingRepository.save(booking);

// Credit provider wallet
User provider = booking.getProvider();
provider.setWalletBalance(provider.getWalletBalance().add(request.getAmount()));
userRepository.save(provider);
```

**Why important:** This shows the complete payment transaction — creates payment record, updates booking status to PAID, and credits the provider's digital wallet. The `@Transactional` annotation ensures atomicity.

---

### 9. Dispute Resolution Workflow (`DisputeController.java`)

```java
// Customer raises
Dispute dispute = Dispute.builder()
    .booking(booking)
    .customer(booking.getCustomer())
    .provider(booking.getProvider())
    .issueDescription(request.getIssueDescription())
    .status(DisputeStatus.OPEN)
    .build();

// Provider responds
dispute.setProviderResponse(request.getMessage());
dispute.setStatus(DisputeStatus.PROVIDER_RESPONDED);

// Admin resolves
dispute.setAdminNotes(request.getMessage());
dispute.setStatus(DisputeStatus.RESOLVED);
dispute.setResolvedAt(LocalDateTime.now());
```

**Why important:** This demonstrates the three-party dispute workflow — customer raises, provider responds, admin resolves. Each step has authorization guards (`@PreAuthorize`) to ensure only the right role can perform each action.

---

### 10. Auth Context State Management (`AuthContext.js`)

```javascript
const login = (data) => {
  if (data?.token) {
    localStorage.setItem("token", data.token);
    const decoded = jwtDecode(data.token);
    const resolvedRole = resolveRoleFromClaims(decoded);
    localStorage.setItem(ACTIVE_ROLE_KEY, resolvedRole);
    const backendUser = data?.user || {};
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify({
      ...backendUser, role: resolvedRole
    }));
    setUser({ ...backendUser, ...decoded, role: resolvedRole });
  }
};
```

**Why important:** This is the frontend's central authentication logic. On login, it stores the JWT token, decodes it to extract the role, persists user info in localStorage for page refreshes, and updates the React Context so all components re-render with the authenticated state.

---

## 16. What Makes This Project Better Than Others

| Feature | FixItNow (Yes) | Typical College Projects (No) |
|---------|-------------|---------------------------|
| **Three-role system** | Customer, Provider, Admin with distinct dashboards | Usually single-role or dual-role |
| **Provider verification** | ID proof + admin approval workflow | No verification mechanism |
| **Real-time chat** | WebSocket (STOMP + SockJS) with JWT auth | Usually no chat or polling-based |
| **Alternative provider fallback** | Auto-suggests available providers when primary is busy | Hard fail on conflict |
| **Dispute resolution** | 8-status workflow (OPEN to RESOLVED/REFUNDED/REJECTED) | No dispute mechanism |
| **Digital wallet** | Provider earnings wallet with balance tracking | No payment system |
| **Geo-spatial search** | Lat/lng based nearby service discovery | Text-only search |
| **Map integration** | Leaflet maps with interactive markers | No visual search |
| **AI assistant** | Context-aware onboarding chatbot | No onboarding help |
| **JWT security** | HS512 signed, 24h expiry, WebSocket auth | Basic session auth or no auth |
| **Analytics dashboard** | Charts for top providers, revenue, demand trends | No analytics |
| **Data seed** | Full seed data with realistic users, services, bookings | Empty database |
| **Dual DB support** | H2 (dev) + MySQL (prod) with profile switching | Hardcoded single DB |
| **Professional UI** | Sidebar layout, animations, responsive design | Basic HTML/CSS |

---

## 17. Design Patterns Used

| Pattern | Where Used | Example |
|---------|-----------|---------|
| **MVC** | Entire backend | Controller -> Service -> Repository |
| **DTO (Data Transfer Object)** | All API responses | `BookingDTO`, `ServiceResponseDTO` |
| **Builder** | Entity/DTO construction | `User.builder().name("...").build()` (Lombok) |
| **Repository** | Data access layer | `UserRepository extends JpaRepository` |
| **Filter Chain** | Security | `JwtAuthenticationFilter extends OncePerRequestFilter` |
| **Interceptor** | HTTP + WebSocket | Axios interceptor, STOMP channel interceptor |
| **Context / Provider** | React state | `AuthContext`, `AppDataContext` |
| **Protected Route** | Frontend routing | `ProtectedRoute` with role check |
| **Adapter** | WebSocket config | `WebSocketMessageBrokerConfigurer` |
| **Singleton** | Spring beans | All `@Service`, `@Component`, `@Repository` are singletons |
| **Template Method** | Security config | `SecurityFilterChain` with chain of rules |
| **Observer** | WebSocket pub/sub | `/topic/chat/{id}` subscribers receive messages |
| **Generic Wrapper** | API responses | `ApiResponse<T>` wraps all responses |

---

## 18. Interview QandA — Every Possible Question

### General / Overview

**Q1: What is FixItNow?**
> FixItNow is a full-stack service booking platform connecting customers with verified local service providers (Electrical, Plumbing, Carpentry). It features three roles — Customer, Provider, and Admin — with end-to-end lifecycle management including booking, real-time chat, payments, reviews, dispute resolution, and admin analytics.

**Q2: What problem does it solve?**
> It solves the difficulty of finding verified, reliable local service providers. Customers can search, book, pay, and review services. Providers get a professional platform to manage their business. Admins ensure quality through provider verification and dispute resolution.

**Q3: What is your role in the project?**
> I was part of Team B (Infosys Springboard). I contributed to both frontend and backend development including [specify your contributions: e.g., booking system, chat feature, admin dashboard, security, etc.].

**Q4: How many modules does the project have?**
> The project has 3 major modules: Backend (Spring Boot), Frontend (React), and Database (MySQL/H2). Within the backend, there are 9 controllers, 6 services, 11 repositories, 15 models, and 27 DTOs.

---

### Architecture

**Q5: What is the architecture of the project?**
> It follows a three-tier architecture: Presentation (React SPA), Application (Spring Boot REST API), and Data (H2/MySQL). The backend uses the MVC pattern with Controller -> Service -> Repository layers. Communication between frontend and backend is via REST APIs (HTTP) and WebSocket (STOMP over SockJS) for real-time chat.

**Q6: Why monorepo structure?**
> We chose a monorepo to keep backend, frontend, and database scripts together for easier development, version control, and deployment. The backend and frontend can still be deployed independently.

**Q7: How does the frontend communicate with the backend?**
> Through Axios HTTP client for REST APIs and SockJS/STOMP for WebSocket real-time communication. An Axios interceptor automatically attaches the JWT token to every request.

---

### Security

**Q8: How is authentication implemented?**
> We use JWT (JSON Web Token) with HS512 HMAC signing. On login, the server validates credentials, generates a JWT token, and returns it. The frontend stores it in localStorage and sends it as `Authorization: Bearer <token>` on every request. The `JwtAuthenticationFilter` validates the token on each request.

**Q9: How is authorization implemented?**
> Two levels: URL-level authorization in `SecurityConfig` (e.g., `/admin/**` requires ADMIN role) and method-level with `@PreAuthorize` annotations (e.g., `@PreAuthorize("hasAuthority('CUSTOMER')")`).

**Q10: How are passwords stored?**
> Using BCrypt hashing via Spring Security's `BCryptPasswordEncoder`. BCrypt is an adaptive function that automatically adds salt and can increase work factor over time.

**Q11: What is the JWT token expiry?**
> 24 hours (86,400,000 milliseconds), configurable via `app.jwtExpirationMs` in application.properties.

**Q12: What happens when a JWT expires?**
> The `JwtAuthenticationFilter` fails validation, sets a `jwt_error` attribute, and `JwtAuthenticationEntryPoint` returns a 401 Unauthorized response with a descriptive error message. The frontend should redirect to login.

**Q13: Why JWT instead of session-based auth?**
> JWT is stateless (no server-side session storage), scalable (works across multiple server instances), mobile-friendly (no cookie dependency), and works naturally with WebSocket authentication.

**Q14: How is the WebSocket secured?**
> JWT token is sent in the STOMP CONNECT frame headers. The `WebSocketConfig` interceptor validates the token and sets the authenticated principal. On SUBSCRIBE, it verifies the user is authorized for that specific topic (e.g., is the user part of that booking?).

---

### Database

**Q15: Why dual database support (H2 + MySQL)?**
> H2 in-memory database allows zero-configuration local development — the backend starts instantly with seed data without needing MySQL. For production/staging, we switch to MySQL using Spring profiles (`--spring.profiles.active=mysql`).

**Q16: How is the database schema created?**
> JPA/Hibernate's `ddl-auto=update` automatically creates/updates tables based on entity annotations. Seed data is loaded from `data.sql` on startup (`spring.sql.init.mode=always`).

**Q17: What are the relationships between entities?**
> - User -> Service (1:N) — one provider has many services
> - User -> Booking (1:N) — both customer and provider have many bookings
> - Booking -> Review/Payment/Dispute/ChatMessage (1:N) — linked by booking
> - Category -> Subcategory (1:N) — hierarchical taxonomy

**Q18: What is the `wallet_balance` field in the User table?**
> It's a `DECIMAL(10,2)` field that tracks a provider's earnings. When a customer makes a payment, the amount is added to the provider's wallet balance in a single transaction using `@Transactional`.

---

### Booking System

**Q19: How does the booking lifecycle work?**
> PENDING (customer creates) -> CONFIRMED (provider accepts) -> COMPLETED (provider marks done) -> PAID (customer pays). At any point before COMPLETED, the customer can CANCEL.

**Q20: How does conflict detection work?**
> When creating a booking, the system checks if the provider already has a confirmed booking for the same date and overlapping time slot. If there's a conflict, it throws an `IllegalArgumentException`.

**Q21: What is the alternative provider fallback?**
> If the primary provider is unavailable, the system finds other providers offering services in the same category who are available for the requested date/time. If `autoFallback=true`, it automatically books with the first available alternative.

**Q22: How are time slots generated?**
> Based on the service's `durationMinutes` and the provider's `availability` string. The system generates slots from 9AM-6PM (configurable), subtracts already-booked slots, and returns available ones.

---

### Chat System

**Q23: How does real-time chat work?**
> We use STOMP protocol over SockJS WebSocket. Client connects to `/ws`, authenticates with JWT on CONNECT, and subscribes to `/topic/chat/{bookingId}`. Messages are sent to `/app/chat.send` and broadcast to the topic by the server.

**Q24: Is there a REST fallback for chat?**
> Yes, `POST /chats/send` and `GET /chats/{bookingId}/history` provide REST endpoints for clients that can't use WebSocket. The REST endpoint also broadcasts the message via WebSocket for real-time delivery.

**Q25: What are the two types of chat?**
> 1. **Booking Chat** — Customer-Provider, scoped to a specific booking
> 2. **Admin Chat** — Admin-Provider, for administrative communication

---

### Frontend

**Q26: How is state managed?**
> Using React Context API. `AuthContext` manages authentication state, and `AppDataContext` (69KB) manages all application data (services, bookings, reviews, etc.) as a centralized store — similar to Redux but using native React.

**Q27: How is routing protected?**
> The `ProtectedRoute` component checks if the user is authenticated and has the correct role. If not, it redirects to `/login`. Each dashboard route is wrapped with its allowed role.

**Q28: What animations are used?**
> Framer Motion is used for page transitions (`AnimatePresence` in `App.js`) and content animations in `PortalLayout` (fade-in + slide-up on route change).

**Q29: How does the map search work?**
> We use Leaflet (open-source map library) with React-Leaflet bindings. The `MapBookingSearch` component renders an interactive map with service markers. Services are searched by lat/lng coordinates within a configurable radius using the backend's `/services/search/nearby` endpoint.

**Q30: What is the AI Help Widget?**
> A floating chatbot component (`AiHelpWidget.js`) that appears on dashboards. It sends user questions to the backend AI assistant endpoint and displays responses. If the backend is unavailable, it provides local fallback suggestions based on the user's role. It auto-opens on first visit.

---

### Spring Boot Specifics

**Q31: What Spring Boot starters do you use?**
> `spring-boot-starter-web` (REST), `spring-boot-starter-data-jpa` (ORM), `spring-boot-starter-security` (auth), `spring-boot-starter-validation` (input validation), `spring-boot-starter-websocket` (chat).

**Q32: What is the context path?**
> `/api` — all endpoints are prefixed with `/api` (configured in `application.properties`).

**Q33: What is Lombok and why use it?**
> Lombok is a Java library that generates boilerplate code at compile time via annotations. We use `@Getter`, `@Setter`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@RequiredArgsConstructor`, `@Data`, and `@Slf4j` to reduce code by approximately 60%.

**Q34: What is the `ApiResponse<T>` pattern?**
> Every API response is wrapped in a generic `ApiResponse<T>` with `success` (boolean), `message` (string), and `data` (T). This provides a consistent response structure for the frontend to parse, regardless of the endpoint.

**Q35: How do you handle exceptions?**
> Controllers use try-catch blocks and return appropriate HTTP status codes (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error) wrapped in `ApiResponse` with `success: false`.

---

### React Specifics

**Q36: Why React over Angular?**
> React has a gentler learning curve, largest ecosystem, and most job market demand. Its component-based architecture with hooks provides flexibility without the complexity of Angular's full framework approach.

**Q37: How does the Axios interceptor work?**
> On every outgoing request, the interceptor checks `localStorage` for a JWT token and adds it to the `Authorization` header. This centralizes auth handling instead of passing tokens to every API call manually.

**Q38: What is `jwt-decode` used for?**
> It decodes the JWT token on the client side to extract claims (email, role, expiry) without making a backend call. This is used in `AuthContext` to restore user state on page refresh.

---

### Deployment / DevOps

**Q39: How would you deploy this in production?**
> Backend: Package as JAR (`mvn package`), deploy to any Java server (AWS EC2, Azure App Service, Railway). Frontend: Build static files (`npm run build`), deploy to CDN (Vercel, Netlify, S3+CloudFront). Database: Managed MySQL (AWS RDS, PlanetScale).

**Q40: What environment variables are needed?**
> `SERVER_PORT`, `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `APP_JWT_SECRET`, `APP_JWT_EXPIRATION_MS`, `GOOGLE_MAPS_API_KEY`. All have defaults for local development.

---

### Performance and Scalability

**Q41: How does pagination work?**
> Spring Data JPA's `Pageable` interface is used across all list endpoints. The frontend sends `page` and `size` query params, and the backend returns `Page<T>` with content, total pages, and total elements.

**Q42: What database optimizations exist?**
> - Database indexes on chat_messages (booking_id, sender_id, receiver_id, booking_id+sent_at), review_notifications (provider_id, is_read, created_at), disputes (booking_id, status)
> - JPA batch inserts (`hibernate.jdbc.batch_size=20`)
> - Lazy loading on all `@ManyToOne` relationships
> - Ordered inserts for batch efficiency

**Q43: How would you scale this system?**
> - Horizontal scaling: JWT is stateless, no sticky sessions needed
> - WebSocket: Can be scaled with a shared message broker (Redis pub/sub, RabbitMQ)
> - Database: Read replicas for query-heavy endpoints
> - Caching: Add Redis cache for frequently accessed data (categories, service listings)

---

### Testing

**Q44: What testing dependencies are included?**
> `spring-boot-starter-test` (JUnit 5, Mockito, MockMvc) and `spring-security-test` for security-aware testing.

---

### Miscellaneous

**Q45: What is the difference between `/auth/signup` and `/auth/register`?**
> They are identical — both call the same `handleRegister()` method. `/auth/signup` was the original Postman endpoint, `/auth/register` was added as an alias for the React frontend.

**Q46: What is `@PreAuthorize` and how is it different from URL-based auth?**
> URL-based auth in `SecurityConfig` controls access at the endpoint level. `@PreAuthorize` in controllers provides fine-grained method-level authorization. For example, `DisputeController.raiseDispute()` has `@PreAuthorize("hasAuthority('CUSTOMER')")` even though the URL might be reachable by any authenticated user.

**Q47: What is the `data.sql` file?**
> It contains seed data (5 users, 3 categories, 9 subcategories, 6 services, 5 bookings, 1 review, 3 chat messages) that auto-loads on H2 startup. It provides a working demo without needing to manually create data.

**Q48: How does the provider approval flow work end-to-end?**
> 1. Provider registers -> `approval_status = PENDING`, gets JWT but can't login
> 2. Provider sees `ProviderPendingApproval` page which polls `/auth/provider-status`
> 3. Admin views pending providers in Admin Dashboard
> 4. Admin clicks Approve -> `approval_status = APPROVED`
> 5. Provider can now login and access their dashboard

**Q49: What is `AppDataContext.js` and why is it so large?**
> At 69KB, it's the centralized global state manager for the entire frontend. It manages fetching, caching, and state for all data domains (services, bookings, reviews, payments, disputes, chat, admin data). It's essentially a custom Redux alternative using React Context. The large size is because it contains all API call functions and state management logic in one file.

**Q50: What makes the booking system "smart"?**
> Three features: (1) Automatic time slot generation based on service duration, (2) Double-booking conflict detection, (3) Alternative provider fallback — instead of simply failing when a provider is busy, it finds and optionally auto-books available providers in the same service category.

---

## End of Documentation

> This document covers every aspect of the FixItNow project. For specific code references, consult the source files listed in Section 7. For API testing, use the endpoint reference in Section 11 with any REST client (Postman, Thunder Client, cURL).
