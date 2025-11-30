# Lab Inventory Management System - Backend

A comprehensive Express.js backend API for managing laboratory inventory, including devices, components, items, users, and operation logs with role-based access control.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Running the Server](#running-the-server)
- [Project Structure](#project-structure)
- [API Overview](#api-overview)
- [Authentication](#authentication)
- [Database Models](#database-models)
- [Error Handling](#error-handling)
- [License](#license)

## ✨ Features

### Authentication & Authorization
- JWT-based authentication with token management
- Cookie-based session handling
- Role-based access control (Admin, Staff, User)
- User registration and login with password hashing (bcrypt)
- Token validation and refresh mechanism

### Core Functionality
- **Lab Management**: Create, read, update, delete laboratory records
- **Device & Component Management**: Track devices, components with status tracking
- **Item Management**: Manage inventory items with categorization
- **Staff Assignment**: Assign staff to labs and manage permissions
- **Operation Logging**: Comprehensive audit trail for all operations
- **State Tracking**: Monitor item state changes with detailed logs
- **Trash Management**: Soft delete functionality with recovery options
- **Search & Filter**: Advanced search across labs, users, items, and templates

### Data Management
- Pagination support for all list endpoints
- Item state tracking and history
- Device status management (broken, repaired, replaced, transferred)
- Template system for item categories
- Comprehensive logging system with timestamps

## 🛠 Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js   | Latest  | Runtime environment |
| Express   | 5.1.0   | Web framework |
| MongoDB   | 6.17.0  | Database |
| Mongoose  | 8.16.4  | ODM for MongoDB |
| JWT       | 9.0.2   | Authentication |
| bcrypt    | 6.0.0   | Password hashing |
| CORS      | 2.8.5   | Cross-origin requests |
| Nodemon   | 3.1.10  | Development server |

## 📦 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd lab-inventory-backend
```

### 2. Install Dependencies
```bash
npm install
```

## 🔧 Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/lab-inventory
# OR for MongoDB Atlas
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lab-inventory

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# CORS Configuration (set in config.js)
# Update ALLOWED_CORS_LIST in config.js as needed
```

## 🎯 Running the Server

### Development Mode (with Nodemon)
```bash
npm run dev
```
Server will start at `http://localhost:5000`

### Production Mode
```bash
npm start
```

### Access API Documentation
Visit `http://localhost:5000/docs` for interactive API documentation

## 📁 Project Structure

```
lab-inventory-backend/
├── API/
│   ├── admin.js           # Admin-only endpoints
│   ├── staff.js           # Staff-specific endpoints
│   ├── common.js          # Common/Public endpoints
├── Models/
│   ├── Users.js           # User schema
│   ├── Labs.js            # Laboratory schema
│   ├── Items.js           # Item schema
│   ├── Component.js       # Component schema
│   ├── Logs.js            # Operation log schema
│   ├── StateLog.js        # State change log schema
│   ├── Templates.js       # Template schema
│   ├── Trash.js           # Trash schema
│   └── Token.js           # Token schema
├── utls/
│   ├── AuthFunctations.js       # Authentication middleware
│   ├── JWTFunctions.js          # JWT utilities
│   ├── MongooseConnect.js       # Database connection
│   ├── ReturnFunctations.js     # Response utilities
│   ├── RequestTimeInfo.js       # Request timing
│   └── Delay.js                 # Delay utility
├── Auth.js                # Authentication routes
├── config.js              # Configuration constants
├── index.js               # Server entry point
├── package.json           # Dependencies
└── vercel.json            # Vercel deployment config
```

## 🔌 API Overview

### Base URL
```
http://localhost:5000
```

### Core Route Groups

#### Authentication Routes (`/auth`)
- `PUT /auth/login` - User login
- `PUT /auth/register` - User registration
- `PUT /auth/login_with_token` - Token-based login
- `PUT /auth/login_with_cookie` - Cookie-based login
- `GET /auth/logout` - User logout

#### Common Routes (`/common`)
- **Profile Management**
  - `GET /common/profile` - Get user profile
  - `PUT /common/profile` - Update profile
  - `PUT /common/change-password` - Change password

- **Lab Operations**
  - `GET /common/labs` - Get all labs (paginated)
  - `GET /common/labs/:labId` - Get lab details with items
  - `GET /common/singleLab/:labId` - Get specific lab
  - `GET /common/staffLabs` - Get staff's assigned labs

- **Search Endpoints**
  - `GET /common/searchLab` - Search labs by name
  - `GET /common/searchLabToInsert` - Search labs with devices
  - `GET /common/searchUser` - Search users
  - `GET /common/searchUserWithFilter` - Search users with role filter
  - `GET /common/searchTemplate` - Search templates

- **Item Management**
  - `GET /common/items/:itemId` - Get item details
  - `GET /common/components/:componentId` - Get component details
  - `PUT /common/move-items` - Move items between locations
  - `PUT /common/move-to-trash` - Move items to trash

- **Logging**
  - `GET /common/logs` - Get operation logs (paginated)
  - `GET /common/logs/:id` - Get specific log
  - `PUT /common/updateStateLog` - Update state log

#### Admin Routes (`/admin`)
- **Template Management**
  - `POST /admin/add-template` - Create template
  - `DELETE /admin/delete-template` - Delete template

- **Lab Management**
  - `POST /admin/create-lab` - Create new lab
  - `GET /admin/labs` - Get all labs
  - `PUT /admin/labs/:labId` - Update lab
  - `DELETE /admin/labs/:labId` - Delete lab

- **Device Management**
  - `POST /admin/add-device` - Add device
  - `PUT /admin/edit-device` - Edit device
  - `DELETE /admin/delete-device` - Delete device

- **Staff Management**
  - `PUT /admin/makeStaff` - Convert user to staff
  - `PUT /admin/deleteStaff` - Remove staff role
  - `PUT /admin/assignStaff` - Assign staff to lab
  - `PUT /admin/removeStaff` - Remove staff from lab

- **Logging**
  - `GET /admin/logs` - Get all logs (paginated)

#### Staff Routes (`/staff`)
- `GET /staff/myLabs` - Get assigned labs (paginated)
- `GET /staff/myItems` - Get items in assigned labs

## 🔐 Authentication

### JWT Token Flow
1. User logs in with credentials
2. Server validates and generates JWT token
3. Token is stored in HTTP-only cookie
4. Client includes token in subsequent requests
5. Middleware verifies token on protected routes

### Authentication Middleware

```javascript
// isUsersRegistered - Any authenticated user
// isUserAdmin - Admin only
// isUserStaff - Staff or Admin
```

### Cookie Configuration
```javascript
const cookieOptions = {
  httpOnly: true,           // Not accessible from JavaScript
  secure: PROD_MODE,        // HTTPS only in production
  sameSite: PROD_MODE ? "none" : "lax",
  path: "/"
};
```

## 💾 Database Models

### User Schema
- `name` - User's full name
- `email_address` - Unique email
- `password` - Hashed password
- `phone` - Contact number
- `address` - Physical address
- `role` - admin | staff | user
- `labs` - Array of assigned labs
- `disabled` - Account status
- `customId` - Custom identifier

### Lab Schema
- `name` - Lab name
- `type` - Lab type/category
- `dept` - Department
- `admins` - Array of admin user IDs
- `staffs` - Array of staff user IDs
- `items` - Array of item IDs
- `components` - Array of component IDs

### Item Schema
- `name` - Item name
- `category` - Item category
- `currentState` - Current status
- `deviceList` - Array of devices
- `componentList` - Array of components
- `dataList` - Associated data

### Log Schema
- `operation` - Operation type
- `itemId` - Reference to item
- `userId` - Reference to user
- `type` - Log type
- `message` - Log message
- `createdAt` - Timestamp

## ❌ Error Handling

All endpoints return standardized responses:

### Success Response
```json
{
  "success": true,
  "message": "Operation Successful",
  "data": {}
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "data": {}
}
```

### HTTP Status Codes
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

## 📊 Total API Endpoints

- **Common Routes**: 15+
- **Admin Routes**: 20+
- **Staff Routes**: 5+
- **Auth Routes**: 5

**Total: 45+ endpoints**

## 🔄 Transaction & Rollback

The `/move-items` endpoint implements atomic transactions:
- Attempts MongoDB session-based transaction
- Falls back to manual rollback if transaction fails
- Ensures data consistency when moving items between locations

## 📝 Notes

- All timestamps are in ISO 8601 format
- Pagination uses 1-based page numbering
- Search queries support regex patterns
- CORS is configured for development and production URLs
- API documentation is available at `/docs` endpoint

## 📄 License

© 2025 Md. Salman Hossain. All rights reserved.
This project is proprietary and may not be used, copied, modified, or distributed without explicit permission.
