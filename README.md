# CivicConnect - Civic Complaint Governance Platform

A production-ready government-grade civic complaint management system built with the MERN stack.

## 🏗️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database (Local instance)
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **node-cron** - Task scheduling

### Frontend
- **React** - UI library (Create React App)
- **React Router v6** - Client-side routing
- **Axios** - HTTP client
- **Context API** - State management
- **Chart.js** - Data visualization

## 📁 Project Structure

```
CivicConnect/
├── backend/
│   ├── config/
│   │   ├── db.js
│   │   └── slaConfig.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Admin.js
│   │   ├── Complaint.js
│   │   ├── Vote.js
│   │   ├── Escalation.js
│   │   ├── Notice.js
│   │   └── GeographicUnit.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── complaintController.js
│   │   ├── adminController.js
│   │   ├── analyticsController.js
│   │   └── publicController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── complaintRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── analyticsRoutes.js
│   │   └── publicRoutes.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── rbac.js
│   │   ├── validation.js
│   │   └── errorHandler.js
│   ├── modules/
│   │   ├── sla/
│   │   │   └── slaService.js
│   │   ├── escalation/
│   │   │   └── escalationService.js
│   │   ├── voting/
│   │   │   └── votingService.js
│   │   ├── analytics/
│   │   │   └── analyticsService.js
│   │   └── credibility/
│   │       └── credibilityService.js
│   ├── utils/
│   │   └── scheduler.js
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── Sidebar.js
    │   │   ├── Header.js
    │   │   ├── Card.js
    │   │   ├── StatusBadge.js
    │   │   └── LoadingSpinner.js
    │   ├── layouts/
    │   │   └── AuthenticatedLayout.js
    │   ├── pages/
    │   │   ├── LoginPage.js
    │   │   ├── DashboardPage.js
    │   │   ├── ComplaintsListPage.js
    │   │   └── NewComplaintPage.js
    │   ├── context/
    │   │   └── AuthContext.js
    │   ├── services/
    │   │   ├── api.js
    │   │   └── complaintService.js
    │   ├── routes/
    │   │   └── ProtectedRoute.js
    │   ├── utils/
    │   │   └── constants.js
    │   ├── App.js
    │   ├── App.css
    │   ├── index.js
    │   └── index.css
    ├── package.json
    └── README.md
```

## 🚀 Getting Started

### Prerequisites

1. **Node.js** (v14 or higher)
2. **MongoDB** (Local installation)
3. **npm** or **yarn**

### MongoDB Setup

1. Install MongoDB Community Edition:
   - Windows: Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
   - macOS: `brew install mongodb-community`
   - Linux: Follow [official guide](https://docs.mongodb.com/manual/administration/install-on-linux/)

2. Start MongoDB service:
   ```bash
   # Windows (as service)
   net start MongoDB
   
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

3. Verify MongoDB is running:
   ```bash
   mongo --eval 'db.runCommand({ connectionStatus: 1 })'
   ```

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://127.0.0.1:27017/civicconnect
   JWT_SECRET=your_secret_key_change_in_production
   JWT_EXPIRE=30d
   BCRYPT_ROUNDS=10
   ```

5. Start the backend server:
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

   Server will run on `http://localhost:5000`

### Frontend Setup

1. Open a new terminal and navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

   Application will open at `http://localhost:3000`

## 👥 User Roles

### 1. CITIZEN
- **Self-registration available** - Citizens can register through the web interface
- **Step-by-step address collection** during registration:
  - Select State
  - Select District
  - Select City/Municipality
  - Select Ward/Village/Block
  - Provide street address, landmark, and pincode
- File complaints (location auto-selected from profile)
- Track complaint status
- Vote on community complaints
- View credibility score

### 2. ADMIN (Level 1, 2, 3)
- **Level 1**: Local Field Officer
- **Level 2**: Division/Block Authority
- **Level 3**: District Authority

Features:
- Manage assigned complaints
- Update complaint status
- Create public notices
- View analytics dashboard

### 3. SUPER_ADMIN
- Full system access
- User management
- System configuration

### 4. GOVERNMENT_ANALYST
- View comprehensive analytics
- Generate reports
- Risk assessment
- Performance metrics

## 🔑 Key Features

### 1. SLA Engine
- Automatic SLA assignment based on category
- Real-time deadline tracking
- Auto-escalation on SLA breach
- Compliance monitoring

### 2. 3-Level Escalation
- Sequential escalation (Level 1 → 2 → 3)
- Geographic jurisdiction maintained
- Department-based assignment
- Audit trail for all escalations

### 3. Community Voting
- One vote per user per complaint
- No self-voting
- Atomic vote counting
- Auto-update impact levels

### 4. Credibility System
- +5 points for resolved complaints
- -10 points for invalid/rejected complaints
- Score clamped between 0-100
- Tiered credibility badges

### 5. Analytics & Reporting
- Resolution rate by geographic unit
- SLA compliance percentage
- Risk score calculation
- Category-wise distribution
- Department performance ranking
- Recurring issue detection

### 6. Geographic Hierarchy
- Self-referencing structure
- **Primary hierarchy**: STATE → DISTRICT → CITY/MUNICIPALITY → WARD/BLOCK/VILLAGE
- **Complete Tamil Nadu Coverage**: All 38 districts included:
  - **Major Districts**: Chennai, Coimbatore, Madurai, Salem, Tiruchirappalli, Tirunelveli, Vellore, Erode, Tiruppur
  - **All Districts**: Ariyalur, Chengalpattu, Chennai, Coimbatore, Cuddalore, Dharmapuri, Dindigul, Erode, Kallakurichi, Kanchipuram, Kanyakumari, Karur, Krishnagiri, Madurai, Mayiladuthurai, Nagapattinam, Namakkal, Nilgiris, Perambalur, Pudukkottai, Ramanathapuram, Ranipet, Salem, Sivaganga, Tenkasi, Thanjavur, Theni, Thoothukudi, Tiruchirappalli, Tirunelveli, Tirupathur, Tiruppur, Tiruvallur, Tiruvannamalai, Tiruvarur, Vellore, Viluppuram, Virudhunagar
  - Each district has major cities/municipalities with wards
  - Total: 1 State, 38 Districts, 38 Cities, 89+ Wards
- Ancestor/descendant traversal
- **Hierarchical Location Management**: 
  - **Step-by-step registration**: Users select State → District → City → Ward during registration
  - **Cascading dropdowns**: Each level dynamically loads based on parent selection
  - **Complete address storage**: System stores:
    - Primary geographic unit (ward/village level)
    - Street address
    - Landmark (optional)
    - Pincode (optional)
  - Complaints automatically use the user's registered location
  - Users only specify the exact problem location and landmark within their area
  - System maintains jurisdiction through the geographic hierarchy

## 🔒 Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Geographic jurisdiction verification
- IDOR prevention
- Input validation
- Password hashing with bcrypt
- Secure HTTP headers
- XSS protection

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/register    - Register new user
POST   /api/auth/login       - Login
GET    /api/auth/me          - Get current user
```

### Complaints (Citizen)
```
POST   /api/complaints           - Create complaint
GET    /api/complaints/my        - Get my complaints
GET    /api/complaints/:id       - Get complaint details
POST   /api/complaints/:id/vote  - Vote on complaint
```

### Admin
```
GET    /api/admin/complaints          - Get assigned complaints
PUT    /api/admin/complaints/:id      - Update complaint
POST   /api/admin/notices             - Create notice
GET    /api/admin/notices             - Get notices
```

### Analytics
```
GET    /api/analytics/resolution-rate/:geoId    - Resolution rate
GET    /api/analytics/risk-score/:geoId         - Risk score
GET    /api/analytics/sla-compliance/:geoId     - SLA compliance
GET    /api/analytics/dashboard/:geoId          - Dashboard overview
```

### Public
```
GET    /api/public/stats                    - Public statistics
GET    /api/public/notices                  - Public notices
GET    /api/public/geographic-units         - Geographic units
```

## 🎨 UI Features

- Responsive design (mobile-first)
- Role-based navigation
- Collapsible sidebar
- Status badges with color coding
- Loading states & skeletons
- Form validation
- Error handling
- Toast notifications

## 🔄 Background Jobs

- SLA monitoring (runs every 15 minutes)
- Auto-escalation of overdue complaints
- Recurring issue detection
- Data cleanup

## 📊 Database Schema

### Collections
1. **users** - Citizen, Super Admin, Analyst accounts
2. **admins** - Admin accounts with levels
3. **complaints** - All civic complaints
4. **votes** - Community votes
5. **escalations** - Escalation audit trail
6. **notices** - Public announcements
7. **geographicunits** - Hierarchical locations

## 🛠️ Development

### Running Tests
```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

### Building for Production
```bash
# Frontend
cd frontend
npm run build
```

## 📝 Default Credentials

For testing purposes, you can create test users through the registration endpoint or MongoDB directly.

**Sample Citizen:**
```json
{
  "email": "citizen@test.com",
  "password": "password123",
  "name": "Test Citizen",
  "phone": "9876543210",
  "role": "CITIZEN"
}
```

**Sample Admin:**
```json
{
  "email": "admin1@test.com",
  "password": "password123",
  "name": "Admin Level 1",
  "phone": "9876543211",
  "department": "WATER_SUPPLY",
  "level": 1,
  "assigned_geographic_unit_ids": ["<geo_unit_id>"]
}
```

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify firewall settings
- Check MongoDB logs

### Port Already in Use
```bash
# Backend (kill process on port 5000)
npx kill-port 5000

# Frontend (kill process on port 3000)
npx kill-port 3000
```

### CORS Issues
- Ensure backend is running before frontend
- Check CORS configuration in `server.js`

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

CivicConnect Team

## 🤝 Contributing

This is a government-grade production system. Contributions should follow strict coding standards and security guidelines.

---

**Built with ❤️ for better civic governance**
