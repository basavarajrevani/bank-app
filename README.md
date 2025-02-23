# Banking Application Setup Guide

## Prerequisites
1. Node.js (Download and install from https://nodejs.org/)
2. MongoDB Atlas Account (Your database is already configured)
3. Web Browser (Microsoft Edge recommended)

## Project Structure
```
bank/
├── server.js          # Backend server code
├── index.html         # Login/Signup page
├── dashboard.html     # User dashboard
├── .env              # Environment variables
├── package.json      # Project dependencies
└── start.bat         # Startup script
```

## Step-by-Step Setup Instructions

### 1. Install Dependencies
Open a terminal in the project directory and run:
```bash
npm install
```
This will install all required dependencies:
- express
- mongoose
- bcryptjs
- cors
- dotenv

### 2. Verify Environment Variables
Make sure your `.env` file contains:
```env
PORT=3000
MONGODB_URI="mongodb URL"
JWT_SECRET=your_jwt_secret_key_here
```

### 3. Start the Application
There are two ways to start the application:

#### Option 1: Using start.bat (Recommended)
Simply double-click the `start.bat` file or run:
```bash
.\start.bat
```
This will:
- Kill any existing Node.js processes
- Start the server
- Open the application in Microsoft Edge

#### Option 2: Manual Start
If you prefer to start manually, run:
```bash
node server.js
```
Then open `http://localhost:3000/index.html` in your browser.

## Using the Application

### 1. Create a New Account
1. Click "Sign Up" if you're on the login page
2. Fill in your details:
   - Full Name
   - Email Address
   - Password
3. Click "Sign Up"
4. Note down your account number (you'll need it to log in)

### 2. Log In
1. Use your account number and password
2. Click "Login"

### 3. Dashboard Features
- View your current balance
- Make deposits
- Make withdrawals
- View transaction history

## Troubleshooting

### If the server won't start:
1. Check if another process is using port 3000:
```bash
netstat -ano | findstr :3000
```
2. Kill the process if needed:
```bash
taskkill /F /IM node.exe
```

### If you can't connect to MongoDB:
1. Check your internet connection
2. Verify the MONGODB_URI in your .env file
3. Restart the server

### If the page doesn't load:
1. Make sure the server is running (check terminal for errors)
2. Try refreshing the page
3. Clear your browser cache

## Support
If you encounter any issues:
1. Check the terminal for error messages
2. Verify all files are present
3. Ensure all dependencies are installed
4. Try restarting the application
