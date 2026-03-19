# Ravidassia Abroad Web App

## Overview
Ravidassia Abroad is a community-driven web platform designed to connect members of the Ravidassia community worldwide. The platform offers matrimonial services, SC/ST community support, blogs, and showcases famous personalities, among other features. It is built with a React frontend and a Node.js/Express backend, using PostgreSQL for data storage.

---

## Key Features
- **Matrimonial Platform**: Submit and manage biodata for marriage proposals, including photo uploads and detailed personal information.
- **SC/ST Connect**: Submit forms to connect with the community, share information, and request support.
- **Blog System**: Read, create, edit, and manage blog posts and categories (admin only for management).
- **Famous Personalities**: View and manage (admin) profiles of notable community members.
- **Content Requests**: Users can request new content or suggest improvements.
- **Admin Dashboard**: Powerful admin panel for managing users, submissions, blogs, categories, and more.
- **User Authentication**: Register, login (email/password or Google), and manage your profile.
- **Role-Based Access**: Different capabilities for guests, users, moderate admins, and main admins.

---

## User Roles & Capabilities

| Role           | Capabilities                                                                 |
|----------------|------------------------------------------------------------------------------|
| Guest          | View public content, register, login                                         |
| Registered User| Submit matrimonial/SCST forms, comment on blogs, view own submissions        |
| Moderate Admin | All user capabilities + manage blogs, categories, submissions, recipients     |
| Main Admin     | All admin capabilities + manage users and assign roles, delete users          |

---

## Admin Dashboard
Admins can:
- View platform stats (users, submissions, blogs, etc.)
- Manage users (view, change roles, delete)
- Manage SC/ST and matrimonial submissions (view, delete, reply)
- Manage blog posts and categories (create, edit, delete)
- Manage recipients for notifications
- Manage menus and featured personalities

---

## How to Use
1. **Register**: Create an account using your email or Google.
2. **Login**: Access your dashboard and available features.
3. **Submit Forms**: Fill out matrimonial or SC/ST connect forms as needed.
4. **Read Blogs**: Browse community blogs and articles.
5. **Admins**: Access the admin dashboard for management features.

---

## Setup Instructions

### Prerequisites
- Node.js (v16+ recommended)
- PostgreSQL database

### Backend Setup
1. Navigate to the `backend` folder:
   ```sh
   cd backend
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```env
   PORT=5000
   PGHOST=your_db_host
   PGPORT=5432
   PGDATABASE=your_db_name
   PGUSER=your_db_user
   PGPASSWORD=your_db_password
   JWT_SECRET=your_jwt_secret
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_email_password
   ADMIN_NOTIFY_TO=admin_notify_email
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   RESEND_API_KEY=your_resend_api_key
   EMAIL_FROM=your_email_from
   GOOGLE_CLIENT_ID=your_google_client_id
   ```
4. Start the backend server:
   ```sh
   npm start
   ```

### Frontend Setup
1. Navigate to the `ravabroad` folder:
   ```sh
   cd ravabroad
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Create a `.env` file with:
   ```env
   REACT_APP_API_URL_LOCAL=http://localhost:5000
   REACT_APP_API_URL_PROD=https://your-production-api-url
   ```
4. Start the frontend:
   ```sh
   npm start
   ```

---

## Contact & Support
For support or questions, please use the contact form on the website or email the admin team at the address provided in the footer.

---

## License
This project is for community use. Please contact the maintainers for licensing or contribution inquiries.
