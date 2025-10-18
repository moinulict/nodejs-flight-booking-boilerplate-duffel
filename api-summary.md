# 🚀 Flight Booking Platform - API List

## 📋 **Required APIs by Module**

---

## 🔐 **1. Authentication Module**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Reset password request
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/change-password` - Change password

---

## 👤 **2. User Profile Module**
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `POST /api/user/profile/avatar` - Upload profile picture

---

## ✈️ **3. Travelers Module**
- `GET /api/travelers` - List saved travelers
- `POST /api/travelers` - Add new traveler
- `GET /api/travelers/{id}` - Get traveler details
- `PUT /api/travelers/{id}` - Update traveler
- `DELETE /api/travelers/{id}` - Delete traveler

---

## 🎫 **5. Booking Module**
- `POST /api/bookings` - Create flight booking
- `GET /api/bookings` - List user bookings
- `GET /api/bookings/{id}` - Get booking details
- `POST /api/bookings/{id}/cancel` - Cancel booking
- `GET /api/bookings/{id}/ticket` - Download ticket

---

## � **6. Payment Module**
- `POST /api/payments/create-intent` - Create Stripe payment intent
- `POST /api/payments/confirm` - Confirm payment & create booking
- `GET /api/payments/history` - Payment history

---

## � **7. Support Module**
- `POST /api/support/tickets` - Create support ticket
- `GET /api/support/tickets` - Get user's tickets
- `GET /api/support/faq` - Get FAQ list

---