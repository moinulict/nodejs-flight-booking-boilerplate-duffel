# Duffel API Complete Reference Guide

This document contains all request and response payloads for the complete flight booking flow using the Duffel API.

## 📋 Table of Contents
1. [Flight Search Flow](#flight-search-flow)
2. [Booking Flow](#booking-flow)
3. [Complete Integration Examples](#complete-integration-examples)
4. [Error Handling](#error-handling)
5. [Key Learnings](#key-learnings)

---

## 🔍 Flight Search Flow

### Step 1: Create Offer Request

**Endpoint:** `POST /air/offer_requests`

**Request Payload:**
```json
{
  "data": {
    "slices": [
      {
        "origin": "LHR",
        "destination": "JFK",
        "departure_date": "2025-11-30"
      }
    ],
    "passengers": [
      {
        "type": "adult"
      }
    ],
    "cabin_class": "economy"
  }
}
```

**Response Payload:**
```json
{
  "data": {
    "id": "orq_0000AzVj9A4Oee9BCTAnH0",
    "live_mode": false,
    "slices": [
      {
        "origin": {
          "iata_code": "LHR",
          "name": "Heathrow Airport",
          "city_name": "London",
          "country_code": "GB"
        },
        "destination": {
          "iata_code": "JFK", 
          "name": "John F. Kennedy International Airport",
          "city_name": "New York",
          "country_code": "US"
        },
        "departure_date": "2025-11-30"
      }
    ],
    "passengers": [
      {
        "id": "pas_0000AzVj9A4Oee9BCTAnH3",
        "type": "adult",
        "age": null,
        "given_name": null,
        "family_name": null,
        "loyalty_programme_accounts": []
      }
    ],
    "cabin_class": "economy",
    "created_at": "2025-10-23T19:42:52.544Z"
  }
}
```

### Step 2: Get Offers

**Endpoint:** `GET /air/offers?offer_request_id={offer_request_id}`

**Response Payload:**
```json
{
  "data": [
    {
      "id": "off_0000AzVj9AIZnvUPuRo7Mo",
      "live_mode": false,
      "total_amount": "292.08",
      "total_currency": "USD",
      "tax_amount": "44.56",
      "tax_currency": "USD",
      "base_amount": "247.52",
      "base_currency": "USD",
      "passengers": [
        {
          "id": "pas_0000AzVj9A4Oee9BCTAnH3",
          "type": "adult",
          "age": null,
          "given_name": null,
          "family_name": null,
          "loyalty_programme_accounts": []
        }
      ],
      "slices": [
        {
          "id": "sli_0000AzVj9AIZnvUPuRo7Mn",
          "origin": {
            "id": "arp_lhr_gb",
            "iata_code": "LHR",
            "name": "Heathrow Airport",
            "city_name": "London",
            "time_zone": "Europe/London"
          },
          "destination": {
            "id": "arp_jfk_us", 
            "iata_code": "JFK",
            "name": "John F. Kennedy International Airport",
            "city_name": "New York",
            "time_zone": "America/New_York"
          },
          "duration": "PT7H58M",
          "segments": [
            {
              "id": "seg_0000AzVj9AIDpFCptLdpoX",
              "origin": {
                "iata_code": "LHR",
                "name": "Heathrow Airport"
              },
              "destination": {
                "iata_code": "JFK",
                "name": "John F. Kennedy International Airport"
              },
              "departing_at": "2025-11-30T22:27:00",
              "arriving_at": "2025-12-01T01:25:00",
              "duration": "PT7H58M",
              "marketing_carrier": {
                "iata_code": "ZZ",
                "name": "Duffel Airways",
                "id": "arl_00009VME7D6ivUu8dn35WK"
              },
              "operating_carrier": {
                "iata_code": "ZZ",
                "name": "Duffel Airways",
                "id": "arl_00009VME7D6ivUu8dn35WK"
              },
              "marketing_carrier_flight_number": "1136",
              "operating_carrier_flight_number": "1136",
              "aircraft": {
                "iata_code": "773",
                "name": "Boeing 777-300"
              },
              "stops": []
            }
          ]
        }
      ],
      "owner": {
        "iata_code": "ZZ",
        "name": "Duffel Airways",
        "id": "arl_00009VME7D6ivUu8dn35WK"
      },
      "payment_requirements": {
        "requires_instant_payment": false,
        "payment_required_by": null,
        "price_guarantee_expires_at": "2025-10-23T20:42:52.544Z"
      }
    }
  ]
}
```

---

## 🎫 Booking Flow

### Step 3: Create Order (Booking)

**Endpoint:** `POST /air/orders`

**Request Payload:**
```json
{
  "data": {
    "selected_offers": [
      "off_0000AzVj9AIZnvUPuRo7Mo"
    ],
    "passengers": [
      {
        "id": "pas_0000AzVj9A4Oee9BCTAnH3",
        "type": "adult",
        "title": "mr",
        "given_name": "Moinul",
        "family_name": "Islam",
        "email": "a@y.com",
        "phone_number": "+8801616848425",
        "born_on": "1987-01-01",
        "gender": "m",
        "age": null,
        "loyalty_programme_accounts": []
      }
    ],
    "payments": [
      {
        "type": "balance",
        "currency": "USD",
        "amount": "292.08"
      }
    ],
    "type": "instant"
  }
}
```

**Response Payload:**
```json
{
  "data": {
    "id": "ord_0000AzVj9lM41vGQpyivRL",
    "live_mode": false,
    "booking_reference": "WMEKDS",
    "type": "instant",
    "total_amount": "292.08",
    "total_currency": "USD",
    "tax_amount": "44.56",
    "tax_currency": "USD", 
    "base_amount": "247.52",
    "base_currency": "USD",
    "offer_id": "off_0000AzVj9AIZnvUPuRo7Mo",
    "created_at": "2025-10-23T19:42:59.483818Z",
    "synced_at": "2025-10-23T19:42:59Z",
    "available_actions": ["cancel", "change", "update"],
    "payment_status": {
      "awaiting_payment": false,
      "payment_required_by": null,
      "price_guarantee_expires_at": null,
      "paid_at": "2025-10-23T19:42:59Z"
    },
    "booking_references": [
      {
        "booking_reference": "WMEKDS",
        "carrier": {
          "iata_code": "ZZ",
          "name": "Duffel Airways",
          "id": "arl_00009VME7D6ivUu8dn35WK"
        }
      }
    ],
    "passengers": [
      {
        "id": "pas_0000AzVj9A4Oee9BCTAnH3",
        "type": "adult",
        "title": "mr",
        "given_name": "Moinul",
        "family_name": "Islam",
        "born_on": "1987-01-01",
        "gender": "m",
        "email": "a@y.com",
        "phone_number": "+8801616848425",
        "infant_passenger_id": null,
        "user_id": null,
        "loyalty_programme_accounts": []
      }
    ],
    "slices": [
      {
        "id": "sli_0000AzVj9AIZnvUPuRo7Mn",
        "origin_type": "airport",
        "destination_type": "airport",
        "fare_brand_name": "Basic",
        "duration": "PT7H58M",
        "origin": {
          "id": "arp_lhr_gb",
          "type": "airport",
          "iata_code": "LHR",
          "name": "Heathrow Airport",
          "city_name": "London",
          "iata_city_code": "LON",
          "iata_country_code": "GB",
          "time_zone": "Europe/London",
          "latitude": 51.470311,
          "longitude": -0.458118
        },
        "destination": {
          "id": "arp_jfk_us",
          "type": "airport", 
          "iata_code": "JFK",
          "name": "John F. Kennedy International Airport",
          "city_name": "New York",
          "iata_city_code": "NYC",
          "iata_country_code": "US",
          "time_zone": "America/New_York",
          "latitude": 40.640556,
          "longitude": -73.778519
        },
        "segments": [
          {
            "id": "seg_0000AzVj9AIDpFCptLdpoX",
            "departing_at": "2025-11-30T22:27:00",
            "arriving_at": "2025-12-01T01:25:00",
            "duration": "PT7H58M",
            "distance": "5539.8359982030115",
            "marketing_carrier_flight_number": "1136",
            "operating_carrier_flight_number": "1136",
            "origin_terminal": "2",
            "destination_terminal": "1",
            "aircraft": {
              "id": "arc_00009VMF8AhXSSRnQDI6HE",
              "iata_code": "773",
              "name": "Boeing 777-300"
            },
            "marketing_carrier": {
              "id": "arl_00009VME7D6ivUu8dn35WK",
              "iata_code": "ZZ",
              "name": "Duffel Airways"
            },
            "operating_carrier": {
              "id": "arl_00009VME7D6ivUu8dn35WK",
              "iata_code": "ZZ",
              "name": "Duffel Airways"
            },
            "origin": {
              "id": "arp_lhr_gb",
              "iata_code": "LHR",
              "name": "Heathrow Airport"
            },
            "destination": {
              "id": "arp_jfk_us",
              "iata_code": "JFK", 
              "name": "John F. Kennedy International Airport"
            },
            "stops": [],
            "passengers": [
              {
                "passenger_id": "pas_0000AzVj9A4Oee9BCTAnH3",
                "cabin_class": "economy",
                "cabin_class_marketing_name": "Economy",
                "seat": null,
                "baggages": [
                  {
                    "type": "checked",
                    "quantity": 1
                  },
                  {
                    "type": "carry_on",
                    "quantity": 1
                  }
                ]
              }
            ]
          }
        ],
        "conditions": {
          "change_before_departure": {
            "allowed": true,
            "penalty_amount": "40.00",
            "penalty_currency": "GBP"
          }
        }
      }
    ],
    "documents": [
      {
        "type": "electronic_ticket",
        "unique_identifier": "1",
        "passenger_ids": [
          "pas_0000AzVj9A4Oee9BCTAnH3"
        ]
      }
    ],
    "services": [],
    "conditions": {
      "change_before_departure": {
        "allowed": true,
        "penalty_amount": "40.00", 
        "penalty_currency": "GBP"
      },
      "refund_before_departure": {
        "allowed": true,
        "penalty_amount": "40.00",
        "penalty_currency": "GBP"
      }
    },
    "owner": {
      "id": "arl_00009VME7D6ivUu8dn35WK",
      "iata_code": "ZZ",
      "name": "Duffel Airways"
    },
    "metadata": null,
    "users": [],
    "content": "managed",
    "changes": [],
    "cancelled_at": null,
    "cancellation": null,
    "airline_initiated_changes": [],
    "void_window_ends_at": null
  }
}
```

---

## 🔗 Complete Integration Examples

### Frontend to Backend Flow

#### 1. Search Flights (Frontend → Backend)

**Frontend Request to `/api/search-flights`:**
```json
{
  "origin": "LHR",
  "destination": "JFK",
  "departureDate": "2025-11-30",
  "returnDate": null,
  "passengers": [{"type": "adult"}],
  "cabinClass": "economy"
}
```

**Backend Response:**
```json
{
  "success": true,
  "request_id": "orq_0000AzVj9A4Oee9BCTAnH0",
  "data": [
    {
      "id": "off_0000AzVj9AIZnvUPuRo7Mo",
      "total_amount": "292.08",
      "total_currency": "USD",
      "passengers": [
        {
          "id": "pas_0000AzVj9A4Oee9BCTAnH3",
          "type": "adult"
        }
      ]
      // ... rest of offer data
    }
  ]
}
```

#### 2. Create Booking (Frontend → Backend)

**Frontend Request to `/api/book-flight`:**
```json
{
  "offer_id": "off_0000AzVj9AIZnvUPuRo7Mo",
  "passengers": [
    {
      "id": "pas_0000AzVj9A4Oee9BCTAnH3",
      "type": "adult",
      "title": "mr",
      "given_name": "Moinul",
      "family_name": "Islam",
      "email": "a@y.com",
      "phone_number": "+8801616848425",
      "born_on": "1987-01-01",
      "gender": "m"
    }
  ],
  "total_amount": "292.08",
  "total_currency": "USD"
}
```

**Backend Response:**
```json
{
  "success": true,
  "booking_id": "ord_0000AzVj9lM41vGQpyivRL",
  "booking_reference": "WMEKDS",
  "message": "Booking created successfully"
}
```

---

## 🚨 Error Handling

### Common Error Scenarios

#### 1. Missing Passenger ID Error

**Request (Incorrect - Missing ID):**
```json
{
  "data": {
    "selected_offers": ["off_0000AzViC1MpFlPZee2gqI"],
    "passengers": [
      {
        "type": "adult",
        "title": "mr",
        "given_name": "Moinul",
        "family_name": "Islam"
        // Missing "id" field
      }
    ]
  }
}
```

**Error Response:**
```json
{
  "errors": [
    {
      "documentation_url": "https://duffel.com/docs/api/overview/response-handling",
      "source": {
        "field": "id",
        "pointer": "/passengers/0/id"
      },
      "title": "Required field",
      "type": "validation_error",
      "message": "Field 'id' can't be blank",
      "code": "validation_required"
    }
  ],
  "meta": {
    "request_id": "GHE19_p7nu7Oby0ADU-C",
    "status": 422
  }
}
```

#### 2. Invalid Passenger ID Error

**Request (Incorrect - Wrong ID):**
```json
{
  "data": {
    "passengers": [
      {
        "id": "pas_invalid_id_123",
        "type": "adult"
      }
    ]
  }
}
```

**Error Response:**
```json
{
  "errors": [
    {
      "documentation_url": "https://duffel.com/docs/api/overview/response-handling",
      "source": {
        "field": "id",
        "pointer": "/passengers/0/id"
      },
      "title": "Linked record(s) not found",
      "type": "validation_error",
      "message": "Field 'id' contains ID(s) of linked record(s) that were not found in your account",
      "code": "not_found"
    }
  ]
}
```

#### 3. Currency Mismatch Error

**Request (Incorrect Currency):**
```json
{
  "data": {
    "payments": [
      {
        "type": "balance",
        "currency": "GBP",  // Offer requires USD
        "amount": "100.00"
      }
    ]
  }
}
```

**Error Response:**
```json
{
  "errors": [
    {
      "source": {
        "field": "currency",
        "pointer": "/payments/0/currency"
      },
      "title": "Value doesn't match our records",
      "type": "validation_error",
      "message": "Field 'currency' didn't match USD",
      "code": "no_match"
    }
  ]
}
```

---

## 💡 Key Learnings

### Critical Requirements

1. **Passenger IDs are MANDATORY**
   - Passenger IDs are generated during offer request creation
   - These IDs MUST be preserved and used in the booking request
   - Never remove or regenerate passenger IDs

2. **Currency Consistency**
   - Use the exact currency from the offer
   - Payment currency must match offer currency

3. **Required Passenger Fields for Booking:**
   ```json
   {
     "id": "pas_xxx", // From offer request - REQUIRED
     "type": "adult", // From offer request  
     "title": "mr",   // New - REQUIRED
     "given_name": "John", // New - REQUIRED
     "family_name": "Doe", // New - REQUIRED
     "born_on": "1990-01-01", // New - REQUIRED
     "gender": "m", // New - REQUIRED
     "email": "john@example.com", // Optional but recommended
     "phone_number": "+1234567890" // Optional but recommended
   }
   ```

4. **Booking Flow Order:**
   ```
   Search → Offer Request → Get Offers → Select Offer → Create Order
        ↓              ↓           ↓            ↓
   Passenger Type → Passenger ID → Same ID → Same ID (+ details)
   ```

### Best Practices

1. **Always preserve passenger IDs** from offer requests
2. **Validate currency** matches between offer and payment
3. **Store offer request ID** for reference
4. **Handle errors gracefully** with proper error messages
5. **Log all API interactions** for debugging

### Environment Setup

```bash
# Required Environment Variables
DUFFEL_API_TOKEN=duffel_test_your_token_here
PORT=3000

# API Base URL
DUFFEL_API_BASE=https://api.duffel.com
```

### Headers Required

```json
{
  "Authorization": "Bearer duffel_test_your_token_here",
  "Content-Type": "application/json",
  "Accept": "application/json",
  "Duffel-Version": "v2"
}
```

---

## 📚 Additional Resources

- [Duffel API Documentation](https://duffel.com/docs/api)
- [Order Creation Guide](https://duffel.com/docs/api/orders/create-order)
- [Offer Requests Guide](https://duffel.com/docs/api/offer-requests)
- [Response Handling](https://duffel.com/docs/api/overview/response-handling)

---

**Last Updated:** October 24, 2025  
**API Version:** v2  
**Test Mode:** All examples use test mode data