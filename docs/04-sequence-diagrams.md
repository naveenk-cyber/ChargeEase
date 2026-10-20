# 04 — Sequence Diagrams

Participants are the real modules of this system:

| Alias | Module |
| --- | --- |
| Browser UI | React pages/components (`frontend/src/pages`, `frontend/src/components`) |
| Auth provider | `frontend/src/hooks/useAuth.tsx` |
| API client | `frontend/src/services/api.ts` (adds the `Authorization: Bearer` header) |
| API | Express routers (`backend/src/routes/*.js`) |
| Validate / repo | `backend/src/validate.js`, `backend/src/repo.js` |
| DB | SQLite via `node:sqlite` (`backend/src/db.js`) |

---

## 1. Sign-up (UC-02)

```mermaid
sequenceDiagram
  autonumber
  actor V as Visitor
  participant UI as SignupPage (/signup)
  participant C as API client
  participant API as POST /auth/signup
  participant Vd as validate.js
  participant DB as SQLite

  V->>UI: fill name, email, password, confirm, accept terms
  UI->>UI: zod schema validation
  alt invalid field
    UI-->>V: message beside the field (role="alert")
  else valid
    UI->>C: authService.signup(payload)
    C->>API: POST /api/v1/auth/signup (no auth header)
    API->>Vd: sanitise + validate email/password policy
    alt duplicate email or weak password
      API-->>C: 409 CONFLICT ("An account with this email already exists.")
      API-->>C: 400 VALIDATION_ERROR ("Passwords do not match." / password policy)
      C-->>UI: ApiError
      UI-->>V: error alert shown
    else accepted
      API->>DB: BEGIN IMMEDIATE
      API->>DB: INSERT users (scrypt password_hash, salt)
      API->>DB: INSERT wallets (balance_minor = 0, simulated = 1)
      API->>DB: INSERT auth_sessions (expires_at = now + SESSION_TTL_HOURS)
      API->>DB: COMMIT
      API-->>C: 201 { user, token, expiresAt }
      C->>C: tokenStore.set(token)
      UI-->>V: navigate to /dashboard
    end
  end
```

## 2. Sign-in and session restore (UC-03, FR-7)

```mermaid
sequenceDiagram
  autonumber
  actor D as Visitor
  participant UI as LoginPage (/login)
  participant A as useAuth (AuthProvider)
  participant C as API client
  participant API as /auth/*
  participant DB as SQLite

  Note over A: On first load AuthProvider calls restore()
  A->>C: tokenStore.get()
  alt token present
    C->>API: GET /auth/me (Bearer token)
    API->>DB: SELECT session WHERE revoked = 0 AND expires_at > now
    alt valid
      API-->>C: 200 { user }
      A->>A: setUser(user) → isAuthenticated = true
    else expired or revoked
      API-->>C: 401 UNAUTHORIZED
      C->>C: tokenStore.clear()
      A->>A: setUser(null)
    end
  else no token
    A->>A: isLoading = false (stay signed out)
  end

  D->>UI: email + password (or "Use the demo account")
  UI->>C: authService.login({ email, password })
  C->>API: POST /auth/login
  API->>DB: SELECT user, verify scrypt hash (timing-safe)
  alt credentials invalid
    API-->>C: 401 UNAUTHORIZED ("Invalid email or password.")
    UI-->>D: the API message, shown in role="alert"
  else valid
    API->>DB: INSERT auth_sessions
    API-->>C: 200 { user, token, expiresAt }
    C->>C: tokenStore.set(token)
    UI-->>D: navigate to from ?? /dashboard
  end
```

> Note: an unreachable API (`NETWORK_ERROR`, status 0) does **not** clear the stored
> token, so a network blip never signs a driver out. Covered by
> `ProtectedRoute.test.tsx`.

## 3. Station search with filters (UC-06, UC-07)

```mermaid
sequenceDiagram
  autonumber
  actor D as Driver
  participant UI as SearchPage (/search)
  participant RQ as React Query cache
  participant C as API client
  participant API as GET /stations
  participant DB as SQLite

  D->>UI: type query / toggle filter chips / move price slider
  UI->>UI: build SearchFilters, reset page to 1
  UI->>RQ: useQuery(['stations','search',filters,page])
  RQ->>C: stationService.searchStations(filters, page, 12)
  C->>API: GET /stations?q=…&chargingSpeed=…&connectorType=…&available=…&sort=…&page=…
  API->>API: positiveIntQuery + oneOf(SORTS) validation
  API->>DB: SELECT … WHERE … (bound parameters) ORDER BY … LIMIT/OFFSET
  API->>DB: SELECT COUNT(*) for the total
  alt distance sort with an origin
    API->>API: Haversine distance per station, then sort
  end
  API-->>C: 200 { stations, total, page, limit, hasMore }
  C-->>RQ: cache result
  RQ-->>UI: render cards (list) or Leaflet markers (map)
  UI-->>D: "14 stations" announced via role="status"
  alt API unreachable
    C->>C: withDemoFallback → bundled sample stations, source = 'demo'
    UI-->>D: amber "Demo mode — these are not real stations" banner
  end
```

## 4. Create a booking with conflict detection (UC-13, FR-21)

```mermaid
sequenceDiagram
  autonumber
  actor D as Driver
  participant UI as BookingPage (/bookings?stationId=…)
  participant C as API client
  participant API as POST /bookings
  participant DB as SQLite

  D->>UI: choose connector, date, start time, duration slider
  UI->>UI: estimate energy + cost (labelled "Estimate only")
  D->>UI: Confirm booking
  UI->>C: bookingService.createBooking(input)
  C->>API: POST /bookings (Bearer token)
  API->>API: requireAuth → req.user
  API->>DB: SELECT station + connector (connector must exist for that station)
  alt connector not offered / past start / duration outside 15–480 / station out of service
    API-->>C: 400 VALIDATION_ERROR ("Start time must be in the future.", …)
    API-->>C: 409 CONFLICT ("This station is currently out of service.")
    UI-->>D: the API message
  else input valid
    API->>DB: SELECT overlapping booking for (station_id, connector_type) with an active status
    alt overlap found
      API-->>C: 409 CONFLICT
      UI-->>D: "That connector is already reserved for part of this time window. Pick another time or connector."
    else no overlap
      API->>DB: INSERT bookings (status='confirmed', simulated=1)
      API-->>C: 201 { booking, note }
      UI-->>D: "Booking saved in your account… demo reservation"
    end
  end
```

## 5. Charging session and wallet debit (UC-15, FR-25/26)

```mermaid
sequenceDiagram
  autonumber
  actor D as Driver
  participant UI as BookingPage
  participant C as API client
  participant API as /bookings/:id/*
  participant DB as SQLite

  D->>UI: Start charging
  UI->>C: bookingService.startCharging(id)
  C->>API: POST /bookings/:id/start
  API->>DB: SELECT booking WHERE id
  alt booking belongs to another user
    API-->>C: 403 FORBIDDEN
  else not confirmed
    API-->>C: 409 CONFLICT ("Only a confirmed booking can be started (current: …).")
  else confirmed
    API->>DB: BEGIN IMMEDIATE
    API->>DB: UPDATE bookings SET status='active'
    API->>DB: INSERT charging_sessions (simulated=1, operator_confirmed=0)
    API->>DB: COMMIT
    API-->>C: 200 { session, note }
    UI-->>D: "Charging session started (simulated — no real hardware)"
  end

  D->>UI: Stop charging
  UI->>C: bookingService.stopCharging(id)
  C->>API: POST /bookings/:id/stop
  API->>DB: SELECT open session + station price
  API->>API: energy = f(duration, power); cost = energy × price + session fee
  API->>DB: SELECT wallet balance
  alt booking is not active / no open session
    API-->>C: 409 CONFLICT ("Only an active booking can be stopped.")
  else balance < cost
    API-->>C: 409 CONFLICT ("Insufficient wallet balance for this operation.")
    Note over API,DB: no writes — session stays open, booking stays active
    UI-->>D: the API message explains the wallet is short
  else sufficient
    API->>DB: BEGIN IMMEDIATE
    API->>DB: UPDATE wallets SET balance_minor = balance_minor − cost
    API->>DB: INSERT wallet_transactions (type='charge', balance_after_minor)
    API->>DB: UPDATE charging_sessions SET ended_at, energy_kwh, cost
    API->>DB: UPDATE bookings SET status='completed'
    API->>DB: COMMIT
    API-->>C: 200 { chargingCost, charged: true, note }
    UI-->>D: "Session ended. Estimated cost $1.28 was deducted from your demo wallet."
  end
```

## 6. Review submission and rating aggregation (UC-12, FR-31)

```mermaid
sequenceDiagram
  autonumber
  actor D as Driver
  participant UI as StationDetailsPage (/station/:id)
  participant C as API client
  participant API as /stations/:id/reviews
  participant DB as SQLite

  D->>UI: 5 stars, title, comment → Submit review
  UI->>C: stationService.createReview({ stationId, rating, title, comment })
  C->>API: POST /stations/:id/reviews (Bearer token)
  API->>API: requireAuth + validate rating 1–5 (integer), title 3–120, comment 5–2000
  alt unauthenticated
    API-->>C: 401 UNAUTHORIZED
  else already reviewed this station
    Note over API,DB: one review per user per station (UNIQUE station_id, user_id) —
    API->>DB: UPDATE reviews SET rating, title, comment, updated_at
  else first review
    API->>DB: INSERT reviews
  end
  API->>DB: SELECT review JOIN users (author name)
  API-->>C: 201 { review }
  Note over UI: the station query is invalidated, so the average and count are recomputed from stored reviews
  UI->>C: invalidate reviews + station queries
  UI-->>D: "Thanks — your review was saved." · "5 average from 1 review"
```

## 7. Password reset (UC-04, FR-8/9)

```mermaid
sequenceDiagram
  autonumber
  actor V as Visitor
  participant UI as ForgotPasswordPage / ResetPasswordPage
  participant C as API client
  participant API as /auth/forgot-password, /auth/reset-password
  participant DB as SQLite

  V->>UI: submit email
  UI->>C: authService.forgotPassword(email)
  C->>API: POST /auth/forgot-password
  API->>DB: SELECT user by email
  alt account exists
    API->>DB: INSERT password_resets (SHA-256 token_hash, expires_at = now + 30 min, used = 0)
  end
  API-->>C: 200 { message, devResetToken?, devResetUrl?, emailSent=false }
  Note over UI: Same response either way — no account enumeration
  UI-->>V: link shown, with "Email delivery is not configured" notice

  V->>UI: paste token + new password + confirmation
  UI->>C: authService.resetPassword(token, password)
  C->>API: POST /auth/reset-password
  API->>DB: SELECT reset WHERE token_hash = sha256(token) AND used = 0 AND expires_at > now
  alt token unknown, used or expired
    API-->>C: 400 VALIDATION_ERROR ("This reset link is invalid or has expired.")
  else valid
    API->>DB: BEGIN IMMEDIATE
    API->>DB: UPDATE users SET password_hash = scrypt(new)
    API->>DB: UPDATE password_resets SET used = 1
    API->>DB: UPDATE auth_sessions SET revoked = 1 (all existing sessions)
    API->>DB: COMMIT
    API-->>C: 200 { message }
  end
```
