# AI Expense Tracker & Financial Advisor (MERN Stack)

A complete, production-style, high-fidelity MERN application featuring a dark-themed visual dashboard, **Financial Health Score Calculations (0–100)**, **Statistical Expenditure Forecasting**, **Automated Bank Statement CSV Import with Regex Tagging**, **Scheduled Bill Alerts (Cron)**, and **Print-Ready PDF Balance Sheets**.

---

## 🚀 Architectural Stack
- **Frontend:** React (Vite) + Tailwind CSS + Recharts (Area & Pie data viz) + Lucide Icons + Axios (Request Interceptors)
- **Backend:** Node.js + Express.js + Mongoose + Zod (Strict Schema Validations) + Multer (File Upload stream) + PDFKit (Dynamic PDF generation) + Node-Cron (Background bill alerts)
- **Database:** MongoDB
- **Authentication:** JSON Web Tokens (JWT) + Bcrypt password hashing
- **Root Setup:** Concurrently coordinates backend (Express) and frontend dev client on local ports from a single root process.

---

## 🛠️ Advanced Fintech Features

### 1. Financial Health Score Engine
Calculates an objective, real-time score from **0 to 100** by evaluating four core pillars:
- **Savings Rate (30% weight):** Assesses `((Income - Expense) / Income) * 100`. Ratios above 25% yield a perfect score.
- **Budget Adherence (30% weight):** Evaluates category expenditures against set limits. Penalizes over-budget overruns dynamically.
- **Expense-to-Income Ratio (20% weight):** Assesses solvency (target < 50% based on the 50/30/20 rule).
- **Spending Consistency (20% weight):** Calculates deviations compared to the last 3 months average, flagging spending spikes.

### 2. Statistical Spending Forecasts
Applies an **Exponential Moving Average (EMA)** with a capped **Linear Growth Trend** baseline across historical months to forecast:
- Total expenditures predicted for the next month.
- Estimated savings capacity based on current income levels.
- Category-wise spending splits (Food, Transport, Groceries, etc.).

### 3. Automated Bank Statement CSV Import
Allows the upload of a standard bank statement CSV.
- Automatically scans columns to find headers (Date, Description/Payee, Amount, Type).
- Resolves debit signs (negative amounts logged as expenses, positive as credits).
- Executes a comprehensive **Regex Keyword Heuristic Categorization** script tagging matching transactions into standard financial folders (e.g. Uber/Lyft to Transportation, Walmart/Costco to Groceries, McDonald's/Bistros to Food & Dining, etc.).
- Exposes a **Download Sample CSV Template** utility in the dashboard to let reviewers test uploads instantly.

### 4. Interactive Sandbox Demo Account Seeder
If a new user signs up, their profile starts blank. In a single click from the settings panel or the dashboard banner, a secure sandboxed seeder generates a gorgeous **4-month transactional mock history (Feb, Mar, Apr, May 2026)**, category budgets, active milestones, and scheduled bills specifically for their user ID. Instantly populates all charts, progress metrics, and predictions.

---

## 📂 Project Structure

```
p2/
├── package.json               # Root coordinator using concurrently
├── README.md                  # System instruction handbook
├── .env.example               # Environmental configurations template
├── backend/
│   ├── package.json           # Backend packages (Express, Zod, PDFKit, etc.)
│   ├── server.js              # Server bootstrap entry point
│   └── src/
│       ├── config/            # DB & OpenAI configurations
│       ├── controllers/       # Route controllers (MVC architecture)
│       ├── models/            # Mongoose Schema Definitions (User, Transaction, etc.)
│       ├── middleware/        # JWT guards, error handlers, Zod schema checkers
│       ├── routes/            # MVC Routing bindings
│       ├── services/          # AI advisors, EMA forecasts, PDF synthesis, Cron node-cron
│       └── utils/             # Database seeders, rule engines, CSV auto-taggers
└── frontend/
    ├── package.json           # React packages (Recharts, Lucide, Axios, Tailwind)
    ├── vite.config.js         # Vite compilers & local proxy target settings
    ├── tailwind.config.js     # Tailwind content selectors
    ├── postcss.config.js      # PostCSS linkages
    ├── index.html             # Main entry html, loads Google Inter Font
    └── src/
        ├── main.jsx           # React app bootstrap
        ├── index.css          # Global Tailwind directives & glassmorphic custom classes
        ├── App.jsx            # React router, public pathways & private guards
        ├── utils/             # Axios API clients, cash & date formatters
        ├── context/           # AuthContext managing local storage & headers
        ├── components/        # Sidebar, top Navbar, Layout shell, ProtectedRoute
        └── pages/             # Dashboard, Transactions, Budgets, Goals, Insights, Reports, Settings
```

---

## 🚀 Quick Setup & Run Instructions

### 1. Prerequisite Installations
- Ensure you have **Node.js** (version >= 18) and **MongoDB** installed locally and running.

### 2. Clone/Extract the Project
Ensure the complete folder tree is inside your local directory.

### 3. Configure Environment Variables
Copy `.env.example` to `.env` in the **root** folder. (The backend will load this environment automatically).
```bash
# Set MongoDB connection string and JWT Secrets
PORT=5000
MONGO_URI=mongodb://localhost:27017/ai_expense_tracker
JWT_SECRET=super_secret_jwt_token_change_in_production
JWT_EXPIRES_IN=7d

# (Optional) OpenAI API Key for customized natural language money coaching summaries.
# If left empty, the advisor automatically falls back to the advanced local Rule-Based engine!
OPENAI_API_KEY=
```

### 4. Install Dependencies
Run the following unified setup command from the **root workspace directory**:
```bash
npm run install-all
```
This automatically performs npm installs inside the root, backend, and frontend folders!

### 5. Launch the Application
Run the following concurrent execution command from the **root workspace directory**:
```bash
npm run dev
```
This starts:
- The **Express Backend Server** on `http://localhost:5000`
- The **Vite React Dev Client** on `http://localhost:3000` (automatically proxies `/api` requests to port 5000)

### 6. Review & Testing
- Open your browser to `http://localhost:3000`. You will see the beautiful Landing Page.
- Click **Get Started** or **Sign In**.
- **Instant Demo Access:** Click the **Quick Demo Autofill** button to instantly load seeded credentials:
  - **Email:** `demo@example.com`
  - **Password:** `password123`
- Or, register a completely fresh account, navigate to **Settings**, and click **Execute Sandbox Seeder** to instantly generate 4 months of financial data for your profile!
