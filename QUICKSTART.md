# CivicConnect - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Ensure MongoDB is Running

```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### Step 2: Setup Backend

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Seed sample data (optional but recommended)
node utils/seedData.js

# Start the server
npm start
```

You should see:
```
🚀 CivicConnect Server Running
Port: 5000
MongoDB: Local Instance
```

### Step 3: Setup Frontend

Open a **NEW terminal** window:

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start React app
npm start
```

Browser will automatically open at `http://localhost:3000`

### Step 4: Login or Register

Use these test credentials (if you ran the seed script):

**As Citizen:**
- Email: `citizen@test.com`
- Password: `password123`

**Or create a new citizen account:**
1. Click on "Resident" role
2. Click "Register here" 
3. Fill in your basic details (name, email, phone)
4. **Select your address step-by-step**:
   - Choose your State: Tamil Nadu
   - Choose your District: From all 38 TN districts (Chennai, Coimbatore, Madurai, Salem, etc.)
   - Choose your City/Municipality: Major city in your district
   - Choose your Ward/Village: Specific ward in your city
   - Enter your street address
   - Add landmark (optional)
   - Add pincode (optional)
5. Set your password
6. After registration, you'll be automatically logged in

**As Level 1 Officer:**
- Email: `admin1@test.com`
- Password: `password123`

**As Level 2 Officer:**
- Email: `admin2@test.com`
- Password: `password123`

**As Level 3 Officer:**
- Email: `admin3@test.com`
- Password: `password123`

**As Analyst:**
- Email: `analyst@test.com`
- Password: `password123`

## ✅ Verification Checklist

- [ ] MongoDB is running
- [ ] Backend server running on port 5000
- [ ] Frontend running on port 3000
- [ ] Can access login page
- [ ] Can login successfully
- [ ] Dashboard loads properly

## 🎯 What to Try

### As New Citizen:
1. Register a new account using the step-by-step address form
   - Select State → District → City → Ward
   - Provide complete street address
2. File your first complaint (location auto-selected from your profile)
3. Provide specific address and landmark for the issue
4. View public notices for your area

### As Existing Citizen:
1. File a new complaint (your registered area is auto-selected)
2. Provide specific location and landmark for the issue
3. View your complaints
4. Vote on community complaints
5. Check your credibility score

### As Admin:
1. View assigned complaints
2. Update complaint status
3. Create public notices
4. View analytics dashboard

### As Analyst:
1. View resolution metrics
2. Check risk scores
3. Analyze department performance
4. Identify recurring issues

## 🐛 Common Issues

### Backend won't start
- Check if MongoDB is running
- Check if port 5000 is available
- Verify `.env` file exists

### Frontend won't connect
- Ensure backend is running first
- Check if backend is on port 5000
- Clear browser cache

### Can't login
- Make sure you ran the seed script
- Check MongoDB has data
- Verify correct email/password

## 📚 Next Steps

1. Read the main [README.md](./README.md) for complete documentation
2. Explore the API using Postman
3. Customize geographic units for your region
4. Configure SLA times for different categories
5. Adjust credibility score rules

## 🆘 Need Help?

Check the troubleshooting section in [README.md](./README.md)

---

**Happy Coding! 🎉**
