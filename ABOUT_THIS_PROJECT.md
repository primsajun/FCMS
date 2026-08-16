# ⚽ Football Content Management System (FCMS)

Welcome to the **FCMS**, a fully-automated, real-time football (soccer) companion application. This platform tracks live scores, league standings, player statistics, and season schedules for major European football leagues, including the Premier League, La Liga, and the UEFA Champions League.

---

## ✨ Features

- **🔴 Instant Live Scores:** Live matches are polled every 60 seconds and pushed to the screen instantly. You never have to refresh the page to see a goal.
- **📊 Dynamic Standings:** Always up-to-date points tables showing Wins, Losses, Draws, and Goal Differentials.
- **🏆 Player Statistics:** Tracks the Top Goal Scorers and Top Assist Leaders across multiple leagues.
- **📅 Season Schedules:** A comprehensive database of past and upcoming fixtures.
- **🛡️ Secure Admin Dashboard:** A hidden CMS (Content Management System) where administrators can log in to manually override match data, manage custom teams, or upload bespoke logos if desired.

---

## 🛠️ Technology Stack

This application is built on a modern, highly-scalable, and serverless technology stack:

### Frontend
- **React (Vite):** Blazing fast frontend framework for building the user interface.
- **Tailwind CSS:** Utility-first CSS framework for beautiful, responsive, and custom styling.
- **Lucide React:** Beautiful and lightweight icon library.

### Backend & Database
- **Supabase (PostgreSQL):** The core database storing all fixtures, stats, and standings.
- **Supabase Realtime:** Uses WebSockets to broadcast database changes directly to the React frontend in milliseconds.
- **Row Level Security (RLS):** Ensures that only authenticated administrators can manually edit data via the dashboard, while public users have strict read-only access.

### Automation & Hosting
- **Netlify:** Hosts the lightning-fast frontend static assets on their global CDN.
- **Netlify Serverless Functions:** Acts as the backend API layer. Tiny, invisible Node.js scripts that wake up, pull data, update the database, and go back to sleep.
- **Cron-Job.org:** A community-funded robotic trigger that pings our Netlify functions on a precise schedule (every 60 seconds for live matches, hourly for stats).

### Data Provider
- **Football-Data.org API:** The trusted, ultra-fast source of truth for global football data.

---

## ⚙️ Architecture: How it Works Under the Hood

Unlike traditional apps that crash when too many users refresh the page to check a live score, this application is engineered to handle massive scale (10,000+ users) using a brilliant "decoupled" architecture:

1. **The Trigger:** `Cron-job.org` acts as a clock. Every 60 seconds, it sends a single invisible HTTP ping to a Netlify Serverless Function (`/syncLive`).
2. **The Sync:** The Netlify Function wakes up, asks the *Football-Data.org API* if anyone has scored a goal, and then immediately updates the *Supabase* database. It then goes back to sleep.
3. **The Broadcast:** The moment the database changes, *Supabase Realtime* shoots a WebSocket message down to every single user who has the app open on their phone or laptop.
4. **The Result:** The score on the user's screen changes magically in real-time. 

Because the users are only ever talking to Supabase (and never triggering the API fetches themselves), the application bypasses harsh API rate limits entirely and remains 100% free to operate!
