# Test Credentials for RestArtuz App

## Admin Account
- **Email:** rustam2505051@gmail.com
- **Password:** @Rus2505051bek
- **Role:** admin
- **Status:** Active

## Firebase Details
- **Project ID:** restartuz
- **Auth:** Firebase Authentication enabled
- **Database:** Cloud Firestore

## How to Test Admin Panel
1. Navigate to `/admin` or tap the "Admin" button on home screen
2. Enter the credentials above
3. You will be redirected to the Admin Dashboard

## Notes
- Admin user has been created in both Firebase Authentication and Firestore
- Firestore document contains: `{ email, role: "admin", admin: true, isActive: true }`
- Login requires both Firebase Auth user AND Firestore user document with admin=true
