# 03 — Class Diagram

The backend is deliberately not object-oriented: it is a layered Express
application whose persistence model *is* the SQLite schema
(`backend/src/db.js`). The classes below therefore come from three places:

1. **Persistence entities** — one class per table, with the columns from the
   migration. See [06-er-diagram.md](06-er-diagram.md) for keys and indexes.
2. **API resources** — the shapes produced by `backend/src/serializers.js` and
   consumed by the frontend types in `frontend/src/types/index.ts`.
3. **Frontend service layer** — the four service objects in
   `frontend/src/services/api.ts` (`authService`, `stationService`,
   `userService`, `bookingService`) plus the React state holders
   (`useAuth`, `useGeolocation`, `useDocumentTitle`).

## Domain and persistence model

```mermaid
classDiagram
  class User {
    +String id
    +String email
    +String passwordHash
    +String name
    +String phone
    +String avatar
    +String membershipLevel
    +String preferencesJson
    +String createdAt
    +String updatedAt
    +signup()
    +login()
    +updateProfile()
  }

  class AuthSession {
    +String id
    +String userId
    +String expiresAt
    +Boolean revoked
    +String createdAt
    +revoke()
    +isValid()
  }

  class PasswordReset {
    +String tokenHash
    +String userId
    +String expiresAt
    +Boolean used
    +String createdAt
    +consume()
  }

  class Wallet {
    +String id
    +String userId
    +Integer balanceMinor
    +String currency
    +Boolean simulated
    +String updatedAt
    +debit(amountMinor)
    +credit(amountMinor)
  }

  class WalletTransaction {
    +String id
    +String walletId
    +String userId
    +String type
    +Integer amountMinor
    +Integer balanceAfterMinor
    +String description
    +String reference
    +Boolean simulated
    +String createdAt
  }

  class Vehicle {
    +String id
    +String userId
    +String make
    +String model
    +Integer year
    +Real batteryCapacityKwh
    +String connectorTypesJson
    +Real estimatedRangeKm
    +Boolean isDefault
    +String createdAt
    +String updatedAt
  }

  class Station {
    +String id
    +String name
    +String address
    +String city
    +String postcode
    +Real latitude
    +Real longitude
    +String operator
    +String hostType
    +String chargingSpeed
    +String status
    +String amenitiesJson
    +String openingHoursJson
    +Real pricePerKwh
    +Real pricePerMinute
    +Real sessionFee
    +String currency
    +String dataSource
    +String lastSyncedAt
    +Real distance
    +getDetails()
    +search(filters)
  }

  class Connector {
    +String id
    +String stationId
    +String type
    +Real maxPowerKw
    +Integer count
    +Boolean available
  }

  class Booking {
    +String id
    +String userId
    +String stationId
    +String connectorType
    +String startTime
    +String endTime
    +Integer durationMinutes
    +String status
    +Real estimatedCost
    +Real energyKwh
    +String currency
    +Boolean simulated
    +String createdAt
    +String updatedAt
    +create()
    +cancel()
    +startSession()
    +stopSession()
  }

  class ChargingSession {
    +String id
    +String bookingId
    +String userId
    +String stationId
    +String connectorType
    +String startedAt
    +String endedAt
    +Real energyKwh
    +Real cost
    +String currency
    +Boolean simulated
    +Boolean operatorConfirmed
    +String createdAt
  }

  class Favorite {
    +String userId
    +String stationId
    +String createdAt
  }

  class Review {
    +String id
    +String stationId
    +String userId
    +Integer rating
    +String title
    +String comment
    +String createdAt
    +String updatedAt
  }

  User "1" --> "*" AuthSession : owns
  User "1" --> "*" PasswordReset : requests
  User "1" --> "1" Wallet : has
  Wallet "1" --> "*" WalletTransaction : records
  User "1" --> "*" Vehicle : registers
  User "1" --> "*" Booking : places
  User "1" --> "*" Favorite : saves
  User "1" --> "*" Review : writes
  User "1" --> "*" ChargingSession : runs
  Station "1" --> "*" Connector : offers
  Station "1" --> "*" Review : receives
  Station "1" --> "*" Favorite : "saved as"
  Station "1" --> "*" Booking : "reserved at"
  Station "1" --> "*" ChargingSession : "serves"
  Booking "0..1" --> "0..1" ChargingSession : "can produce"
```

> `distance` on `Station` is not a column: it is computed per request from the
> supplied origin (`calculateDistance` on the client, Haversine on the server) and
> attached to the serialized resource.

## API resource shapes

```mermaid
classDiagram
  class ChargingStation {
    +String id
    +String name
    +String address
    +String city
    +String postcode
    +Number latitude
    +Number longitude
    +String operator
    +String dataSource
    +String lastSyncedAt
    +Number rating
    +Number reviewCount
    +Number distance
    +String[] amenities
    +ConnectorType[] connectorTypes
    +String chargingSpeed
    +Pricing pricing
    +StationAvailability availability
    +OperatingHours operatingHours
    +String[] images
  }

  class ConnectorType {
    +String id
    +String type
    +Number maxPower
    +Boolean available
    +Number count
  }

  class Pricing {
    +Number perKwh
    +Number perMinute
    +Number sessionFee
    +String currency
  }

  class StationAvailability {
    +String status
    +Number availableConnectors
    +Number totalConnectors
    +Number estimatedWaitTime
  }

  class SearchResult {
    +ChargingStation[] stations
    +Number total
    +Number page
    +Number limit
    +Boolean hasMore
    +String source
  }

  class SearchFilters {
    +String query
    +String city
    +String postcode
    +Location location
    +String[] chargingSpeed
    +String[] connectorTypes
    +String[] amenities
    +String[] operators
    +Boolean availability
    +PriceRange priceRange
    +Number rating
    +String sort
  }

  class UserView {
    +String id
    +String email
    +String name
    +String phone
    +String avatar
    +Vehicle[] vehicles
    +UserPreferences preferences
    +String membershipLevel
    +String createdAt
    +String updatedAt
  }

  class BookingView {
    +String id
    +String stationId
    +ChargingStation station
    +String connectorType
    +String startTime
    +String endTime
    +Number duration
    +String status
    +Number totalCost
    +Number energyDelivered
    +Boolean simulated
  }

  class WalletView {
    +Number balanceMinor
    +Number balance
    +String currency
    +Boolean simulated
  }

  class UserAnalytics {
    +Number totalSessions
    +Number totalEnergyConsumed
    +Number totalCost
    +Number totalBookings
    +MonthlyUsage[] monthlyUsage
    +ChargingStation[] favoriteStations
  }

  SearchResult "1" --> "*" ChargingStation
  ChargingStation "1" --> "*" ConnectorType
  ChargingStation "1" --> "1" Pricing
  ChargingStation "1" --> "1" StationAvailability
  SearchFilters ..> SearchResult : parameterises
  UserView "1" --> "*" VehicleRef
  UserView ..> UserAnalytics : summarised by
```

## Frontend service and state layer

```mermaid
classDiagram
  class ApiClient {
    +request(path, options)
    +buildQuery(query)
    +withDemoFallback(live, fallback)
    +tokenStore
  }
  class ApiError {
    +String code
    +Number status
    +details
    +isNetworkError
  }
  class AuthService {
    +signup(payload)
    +login(credentials)
    +logout()
    +me()
    +forgotPassword(email)
    +resetPassword(token, password)
  }
  class StationService {
    +searchStations(filters, page, limit)
    +getStationById(id, origin)
    +getFilterMeta()
    +getReviews(id, page, limit)
    +createReview(input)
    +addFavorite(id)
    +removeFavorite(id)
    +getFavorites()
  }
  class UserService {
    +getProfile()
    +updateProfile(patch)
    +getVehicles()
    +createVehicle(v)
    +updateVehicle(id, v)
    +deleteVehicle(id)
    +getWallet()
    +getTransactions(page, limit)
    +topUp(amountMinor)
    +getAnalytics()
  }
  class BookingService {
    +createBooking(input)
    +getBookings(status, page, limit)
    +getBooking(id)
    +cancelBooking(id)
    +startCharging(id)
    +stopCharging(id)
    +getHistory(page, limit)
  }
  class AuthProvider {
    +User user
    +Boolean isAuthenticated
    +Boolean isLoading
    +login()
    +signup()
    +logout()
    +refreshUser()
    +updateUser()
  }
  class ApiHooks {
    +useQuery(cache)
    +useMutation()
  }
  class Services_page["Pages (React 19)"] {
    +Home
    +SearchPage
    +StationDetailsPage
    +BookingPage
    +DashboardPage
    +WalletPage
    +ProfilePage
    +MembershipPage
    +AboutPage
    +auth pages
    +NotFoundPage
  }

  ApiClient --> ApiError : throws
  AuthService --> ApiClient
  StationService --> ApiClient
  UserService --> ApiClient
  BookingService --> ApiClient
  Services_page --> AuthService
  Services_page --> StationService
  Services_page --> UserService
  Services_page --> BookingService
  Services_page --> AuthProvider
  Services_page --> ApiHooks
```

**Evidence for this chapter**

* Columns: `backend/src/db.js` (migration `core_schema`).
* Serializers: `backend/src/serializers.js`.
* Types: `frontend/src/types/index.ts`.
* Services: `frontend/src/services/api.ts`; state: `frontend/src/hooks/useAuth.tsx`.
