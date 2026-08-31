# Football Club Management System (FCMS)

## 📌 Overview
The Football Club Management System (FCMS) is a comprehensive, full-stack web application designed for managing football clubs, tracking live match scores, player statistics, team standings, and historic fixtures across top European leagues (Premier League, La Liga, Champions League, Bundesliga, Serie A, and Ligue 1). 

## 🛠 Tech Stack
- **Frontend:** React.js, Vite, Vanilla CSS
- **Backend/Database:** Supabase (PostgreSQL), Supabase Auth
- **Automation/Serverless:** Node.js, Netlify Functions, Cron-job.org
- **Third-Party APIs:** Football-Data.org (Scores/Standings), API-Sports (Team/Player Graphics)

## ✨ Features
- **Real-Time Match Engine:** Live scoreboard and fixture tracking powered by Supabase Realtime subscriptions.
- **Global League Tracking:** Monitor standings, fixtures, and history for 6 major European leagues, including the new 36-team Champions League format.
- **Role-Based Access Control (RBAC):** Customized and secure dashboards tailored to Super Admins, Coaches, and Players.
- **Automated Data Synchronization:** Background Serverless Functions fetch, map, and synchronize massive datasets from third-party APIs into the PostgreSQL database.
- **Premium UI/UX:** Highly responsive, modern dark-mode interface with golden accents, smooth hover animations, and embedded dynamic media.
- **Admin Dashboard:** Enables Super Admins to manually manage player statistics and override API data fallbacks.

## 🏗 Architecture
The application employs a **Decoupled Serverless Architecture** to bypass strict third-party API rate limits (10 requests/minute). 
1. **Data Ingestion:** Netlify Serverless Functions pinged by `cron-job.org` fetch data from REST APIs in the background and insert it into Supabase.
2. **Data Storage:** A centralized Supabase PostgreSQL database serves as the caching and storage layer.
3. **Client Subscription:** The React frontend subscribes to the database via WebSockets (`Supabase Realtime`) to display instant live score updates to thousands of concurrent users without hitting API rate limits.

## 📸 Screenshots
*(Add screenshots of the application here)*

## 🚀 Live Demo
Live deployment: [https://fcms.netlify.app](https://fcms.netlify.app)

## ⚙️ Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/primsajun/FCMS.git
   cd FCMS
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 🔐 Environment Variables
To run this project, you will need to add the following environment variables to your `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
