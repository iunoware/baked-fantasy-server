# Baked Fantasy – Backend Server

## Overview

Baked Fantasy Backend is a production-ready REST API built using **Node.js**, **Express.js**, and **MongoDB**.  
It powers the backend operations for **The Baked Fantasy** application, handling authentication, admin management, product & essential items CRUD operations, image uploads, order processing, Course Video CRUD operations and video access security.

---

## Tech Stack

- **Node.js**
- **Express.js**
- **MongoDB**
- **Mongoose**
- **JWT Authentication**
- **bcryptjs**
- **Multer (Image Uploads)**
- **dotenv**
- **CORS**

## Key Features

- User Authentication (JWT-based)
- Admin Authentication & Authorization
- Product CRUD Operations
- Bakery Essentials CRUD Operations
- Category & Sub-Category Management
- Image Upload Handling (Multer)
- Order Management
- Cart & Purchase Handling
- Course & Video Management (Online / Offline)
- Secure Route Protection using Middleware
- Modular MVC-style Architecture

### Installation

```bash
git clone https://github.com/iunoware/baked-fantasy-server.git
cd baked-fantasy-server
npm install
```

## Environment Variables

Create a `.env` file in the root directory and add:

MONGO_URI=your_mongodb_connection_string
PORT=5000
GOOGLE_CLIENT_ID=google_OAuth_ID
JWT_SECRET=your_secret_key
JWT_EXPIRE=1d

## Running the Backend Server

```bash
npm run dev
```

## Project Structure

- models/ – Database schemas
- routes/ – API route handlers
- middleware/ – Authentication & token verification
- uploads/ – Uploaded images
- server.js – Application entry point

## Contributions

This repository is maintained by **Iunoware Pvt Ltd** for The **Baked Fantasy project**.

- Only authorized team members are allowed to contribute.
- Each contributor must work on their own separate branch.
- Direct commits to the main branch are not allowed.
- All changes must be submitted through pull requests and reviewed before merging.

© Iunoware Pvt Ltd.
All rights reserved.

This codebase is proprietary and intended for official use only.

## Website link

[https://thebakedfantasy.com](https://thebakedfantasy.com)
