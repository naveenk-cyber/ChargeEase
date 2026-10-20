# 05 — Activity Diagrams

## 1. Booking activity (UC-13, FR-19…FR-21)

```mermaid
flowchart TD
  A([Start: driver opens /bookings?stationId=…]) --> B{Station id in the URL?}
  B -- no --> B1[Pick a station from search results] --> B
  B -- yes --> C[Load station + connectors from GET /stations/:id]
  C --> D[Choose connector, date, start time and duration]
  D --> E[Preview estimated energy and cost<br/>labelled 'Estimate only']
  E --> F[Press Confirm booking]
  F --> G{Authenticated?}
  G -- no --> G1[Redirect to /login, remember destination] --> Z([End])
  G -- yes --> H[POST /bookings with Bearer token]
  H --> I{Input valid?}
  I -- "not a future time / duration outside 15–480 /<br/>connector not offered" --> I1[400 VALIDATION_ERROR<br/>show the API message] --> D
  I -- "station out of service" --> I2[409 CONFLICT: station unavailable] --> D
  I -- yes --> J{Overlapping active booking for<br/>station + connector?}
  J -- yes --> J1[409 CONFLICT:<br/>'That connector is already reserved…'] --> D
  J -- no --> K[INSERT bookings<br/>status = confirmed, simulated = 1]
  K --> L[Show 'Booking saved in your account.<br/>This is a demo reservation.']
  L --> M{Start charging now?}
  M -- no --> N[List the booking under Upcoming] --> Z
  M -- yes --> O[POST /bookings/:id/start] --> P[/See charging activity below/] --> Z
```

## 2. Charging session activity (UC-15, FR-24…FR-26)

```mermaid
flowchart TD
  A([Driver taps Start charging]) --> B{Booking status = confirmed?}
  B -- no --> B1[409 CONFLICT: only a confirmed booking can start] --> Z([End])
  B -- yes --> C[BEGIN IMMEDIATE]
  C --> D[UPDATE bookings → active]
  D --> E[INSERT charging_sessions<br/>simulated = 1, operator_confirmed = 0]
  E --> F[COMMIT] --> G[UI: 'Charging session started (simulated)']

  G --> H[Driver taps Stop charging]
  H --> I{Open session for this booking?}
  I -- no --> I1[409 CONFLICT: no open session / not active] --> Z
  I -- yes --> J[Compute energy from duration and connector power]
  J --> K[cost = energy × price_per_kwh + session_fee]
  K --> L{Wallet balance ≥ cost?}
  L -- no --> L1[409 CONFLICT: 'Insufficient wallet balance'<br/>no writes — session stays open] --> Z
  L -- yes --> M[BEGIN IMMEDIATE]
  M --> N[UPDATE wallets: balance − cost]
  N --> O[INSERT wallet_transactions<br/>type = charge, balance_after_minor]
  O --> P[UPDATE charging_sessions: ended_at, energy, cost]
  P --> Q[UPDATE bookings → completed]
  Q --> R[COMMIT]
  R --> S[UI: cost deducted from the demo wallet] --> Z
```

## 3. Session restore and protected access (FR-7, FR-10)

```mermaid
flowchart TD
  A([App loads]) --> B{Token in localStorage?}
  B -- no --> C[isLoading = false, user = null]
  B -- yes --> D[GET /auth/me]
  D --> E{Response}
  E -- "200 with user" --> F[user set → isAuthenticated = true]
  E -- "401 / 403" --> G[Clear token, user = null]
  E -- "network error (status 0)" --> H[Keep token, user = null<br/>do not log the driver out]
  C --> I{Protected route?}
  F --> I
  G --> I
  H --> I
  I -- no --> J[Render the page]
  I -- yes --> K{Authenticated?}
  K -- yes --> J
  K -- no --> L[Redirect to /login with the intended location] --> M([End])
```

## 4. Search, filter and sort activity (UC-06, UC-07, UC-18)

```mermaid
flowchart TD
  A([Visitor opens /search]) --> B[Read initial query params: q, lat, lng, connectorType, chargingSpeed, view]
  B --> C[Load filter metadata<br/>GET /stations/meta/filters]
  C --> D{User action}
  D -- "types a query / presses Search" --> E[Reset page to 1]
  D -- "toggles a chip / moves price slider / availability" --> E
  D -- "changes sort" --> E
  D -- "Near me" --> F[Ask for geolocation]
  F --> G{Permission?}
  G -- granted --> H[Set location filter, radius 25, sort = distance] --> E
  G -- denied --> I[Show an explanatory message, keep manual search] --> E
  E --> J[GET /stations with filters + page + limit]
  J --> K{Outcome}
  K -- "200" --> L{Rows > 0?}
  L -- yes --> M[Render cards or map markers,<br/>announce the count, sync selection]
  L -- no --> N[Empty state + Clear filters]
  K -- "network error" --> O[Fall back to bundled sample stations<br/>show the Demo mode banner]
  M --> P{Change view?}
  N --> P
  O --> P
  P -- "map" --> Q[Update URL ?view=map, mount Leaflet] --> D
  P -- "list" --> R[Remove ?view, render cards] --> D
```
